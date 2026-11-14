# Forma Studio — WordPress / PHP Engineering Lab

**Status: prototype, not production-ready.** An original WordPress plugin written for an independent portfolio project. No employer source, client data, proprietary design, or third-party confidential assets are included.

## Purpose

Demonstrate hands-on PHP 8 and WordPress development beyond page builders: hooks, custom post types, server-side validation, secure form handling, data storage, REST API permissions, sanitization/escaping, and accessible frontend output.

## Implemented in source

- Custom private post type `forma_inquiry`, with an admin interface
- Shortcode `[forma_inquiry_form]` for a responsive inquiry form
- WordPress `admin-post.php` submission handler and POST-only gate
- Nonce verification, field sanitization, email and input-length validation
- Basic honeypot and temporary IP-based throttling
- Separate private name, email and message metadata
- Admin-only paginated `GET /wp-json/forma/v1/inquiries` endpoint
- Original CSS using an editorial cream / ink / berry / lime palette
- Success and error status messages after redirect

## Local test environment

Use a **local disposable WordPress install**, not a live client site.

1. Install a current supported WordPress version with PHP 8+ and a local database.
2. Copy the `forma-studio` directory to `wp-content/plugins/`.
3. Activate **Forma Studio — Inquiry Lab** in WordPress Plugins.
4. Create a local WordPress page with shortcode `[forma_inquiry_form]`.
5. Submit a fictional inquiry and check the **Inquiries** admin menu.
6. As an administrator, request `/wp-json/forma/v1/inquiries` while authenticated.
7. As a logged-out visitor, confirm the private endpoint is forbidden.
8. Test validation errors, CSRF rejection, duplicate submissions and keyboard navigation.

## Security and privacy

- Never insert real contact details when demonstrating this project.
- Do not deploy publicly until a privacy policy, consent/retention handling, spam/rate-limit strategy, email delivery decision, deletion workflow, staging review and security checks are in place.
- WordPress nonces help prevent cross-site requests but do **not** authenticate anonymous visitors or replace anti-spam controls.
- The sample uses a basic transient-based throttling mechanism; it is **not** robust against distributed abuse.
- The API is explicitly restricted to users with `manage_options`. This is not a public-facing contact directory.
- Be mindful of full-page caches when displaying public WordPress nonce-protected forms.
- Verify behavior with integration tests before claiming the plugin has passed security testing.

## CV and portfolio language

Once tested and demonstrated:

> Built an independent WordPress plugin in PHP 8 featuring a custom content type, validated inquiry workflow and an admin-restricted REST endpoint.

Do **not** represent this as professional client work or claim commercial production experience with these specific features solely from this demo.

## Roadmap

- Replace the demo throttle with a production-grade strategy.
- Add automated WordPress integration and security tests.
- Add admin-only review workflow, retention/deletion controls.
- Provide an original demo website and full technical case study.
