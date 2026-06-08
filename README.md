# star-maker
STAR Maker — AI-powered career story builder that helps students and early-career professionals convert resume experiences into polished STAR-format interview answers

## Local testing

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment template:

   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and fill in the values you need:

   ```bash
   DATABASE_URL=postgres://postgres:postgres@localhost:5432/star_maker
   AI_INTEGRATIONS_ANTHROPIC_API_KEY=your_anthropic_key
   AI_INTEGRATIONS_ANTHROPIC_BASE_URL=your_anthropic_base_url
   ELEVENLABS_API_KEY=your_elevenlabs_key
   ELEVENLABS_AGENT_ID=your_elevenlabs_agent_id
   ELEVENLABS_ENVIRONMENT=production
   ```

   Keep `.env` local. It is ignored by git and should not be committed.

4. Start a local Postgres database. One quick Docker option:

   ```bash
   docker run --name star-maker-postgres \
     -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_DB=star_maker \
     -p 5432:5432 \
     -d postgres:16
   ```

   If you already have Postgres running, update `DATABASE_URL` in `.env` to match it.

5. Push the schema into the database:

   ```bash
   npm run db:push
   ```

6. Start the app:

   ```bash
   npm run dev
   ```

7. Open the local URL printed by the dev server, usually:

   ```text
   http://localhost:5000
   ```

The ElevenLabs voice practice flow needs both `ELEVENLABS_API_KEY` and `ELEVENLABS_AGENT_ID`. The rest of the app will load, but starting a voice practice session will fail until those are set.
