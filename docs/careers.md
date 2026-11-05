# Career applications

The public form is at `/careers`. Hiring managers open **Career Applications** in the CRM sidebar, displayed inside the existing CRM dashboard at `${ADMIN_BASE_PATH}?view=applications` (default `/admin?view=applications`). The original `/applications` subpage redirects to this view so saved links keep working. Managers and super admins can view and update applications; operational roles cannot access applications or résumés.

The form accepts inspectors / estimators and repair technicians. Questions cover contact details, suburb/postcode, travel coverage, relevant experience and role-specific skills, work eligibility, preferred engagement, availability, transport, White Card status, qualifications and equipment. Résumé, work examples, pay expectations and recruitment support details are optional. Applicants can submit an experience summary without a résumé.

## Storage and configuration

- Uses the existing `MONGODB_URI` and `MONGODB_DB`. The `careerApplications` collection is created on first successful insert; no migration or new service is required.
- PDF résumés (maximum 3 MB) are stored as private MongoDB binary data in the application document. The list API excludes their contents. Downloads require an authenticated manager session and return an attachment with `private, no-store` caching.
- Existing `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` enable the CAPTCHA. Configure both together. The server verifies the secret whenever configured, and the existing in-memory limiter plus a honeypot limit spam.
- Successful submission is shown only after the database acknowledges the insert. Database failures return an explicit retry message.
- Application statuses: new, reviewing, shortlisted, interview, hired, not proceeding, withdrawn. Saving records the reviewing manager and update time. Notes are internal. No automatic emails or SMS messages are sent.
- Recruitment consent and its notice version are stored with each submission. Careers applications are kept separate from customer leads and marketing lists. The privacy page describes recruitment collection and requests for access, correction, withdrawal or deletion; requests are handled by the business rather than automatic deletion.

## Checks

`node scripts/careers.test.mjs` exercises validation, storage success and failure, PDF validation, CAPTCHA enforcement, manager-only access, downloads, search/pagination and review updates using isolated database/network mocks. It does not insert test applications into the configured database.

Question selection draws on Groutix's repair services, Jobs and Skills Australia's wall and floor tiler profile (https://www.jobsandskills.gov.au/data/occupation-and-industry-profiles/occupations/3334-wall-and-floor-tilers), and the Victorian Equal Opportunity and Human Rights Commission's recruitment guidance (https://www.humanrights.vic.gov.au/for-individuals/recruitment-and-designated-roles/). These informed practical skills and job-related screening questions, rather than mandatory external certifications.
