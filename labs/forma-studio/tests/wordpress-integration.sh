#!/usr/bin/env bash
set -euo pipefail
# Disposable WordPress integration test. All content fictional; never run on a live site.
ROOT="$PWD"
TESTROOT="$(mktemp -d)"
cleanup() { rc=$?; if [ "$rc" -ne 0 ]; then echo "WP integration failed at stage, page response:"; test -f "$TESTROOT/page.html" && head -c 700 "$TESTROOT/page.html" || true; echo "PHP server logs:"; test -f "$TESTROOT/php-server.log" && tail -n 30 "$TESTROOT/php-server.log" || true; fi; if [ -n "${SERVER_PID:-}" ]; then kill "$SERVER_PID" 2>/dev/null || true; fi; rm -rf "$TESTROOT"; }
trap cleanup EXIT
cd "$TESTROOT"
wp core download --quiet
wp config create --dbname=forma_integration --dbuser=root --dbpass=forma_test_pw --dbhost=127.0.0.1 --skip-check --quiet
wp core install --url=http://127.0.0.1:8091 --title="Forma Studio QA" --admin_user=admin --admin_password='test-only-password-do-not-reuse' --admin_email=admin@example.test --skip-email --quiet
mkdir -p wp-content/plugins/forma-studio
cp "$ROOT/labs/forma-studio/forma-studio.php" wp-content/plugins/forma-studio/
cp -r "$ROOT/labs/forma-studio/assets" wp-content/plugins/forma-studio/
wp plugin activate forma-studio --quiet
PAGE_ID=$(wp post create --post_type=page --post_status=publish --post_title='Demo inquiry' --post_content='[forma_inquiry_form]' --porcelain)
PAGE_URL=$(wp post url "$PAGE_ID")
php -S 127.0.0.1:8091 -t "$TESTROOT" >"$TESTROOT/php-server.log" 2>&1 &
SERVER_PID=$!
for i in $(seq 1 30); do
  if curl -fsS "$PAGE_URL" -o "$TESTROOT/page.html" 2>/dev/null; then break; fi
  sleep 1
done
test -s "$TESTROOT/page.html"
grep -q 'forma_nonce' "$TESTROOT/page.html"
NONCE="$(python3 - "$TESTROOT/page.html" <<'PY'
import re,sys
page=open(sys.argv[1]).read()
m=re.search(r'name="forma_nonce" value="([^"]+)"',page)
assert m,'Nonce field not found in rendered WordPress page'
print(m.group(1))
PY
)"
# Public visitors should never retrieve private inquiry data.
CODE=$(curl -sS -o "$TESTROOT/rest.json" -w '%{http_code}' "http://127.0.0.1:8091/?rest_route=/forma/v1/inquiries")
test "$CODE" = "401" -o "$CODE" = "403"
# Missing/invalid CSRF token must be rejected.
CODE=$(curl -sS -o /dev/null -w '%{http_code}' -X POST 'http://127.0.0.1:8091/wp-admin/admin-post.php' -d 'action=forma_submit_inquiry&name=Fake+Name&email=fake@example.test&message=Fictional+project')
test "$CODE" = "403"
# Anonymous visitors can submit a synthetic record with a valid form nonce.
CODE=$(curl -sS -o /dev/null -w '%{http_code}' -X POST 'http://127.0.0.1:8091/wp-admin/admin-post.php' \
  --data-urlencode "action=forma_submit_inquiry" \
  --data-urlencode "forma_nonce=$NONCE" \
  --data-urlencode 'name=Example Tester' \
  --data-urlencode 'email=fictional@example.test' \
  --data-urlencode 'message=An original fictional portfolio project, no real user data' \
  --data-urlencode 'website=')
test "$CODE" = "303"
# Check created record and restricted admin REST response using WP internals.
wp eval '
$q = get_posts(["post_type"=>"forma_inquiry","post_status"=>"private","numberposts"=>-1]);
if(count($q)!==1)throw new RuntimeException("Expected one private inquiry");
if(get_post_meta($q[0]->ID,"_forma_email",true)!=="fictional@example.test")throw new RuntimeException("Unexpected metadata");
wp_set_current_user(1);
$req = new WP_REST_Request("GET","/forma/v1/inquiries");
$res = rest_do_request($req);
if($res->get_status()!==200)throw new RuntimeException("Admin REST failed");
$data=$res->get_data();
if(count($data["data"])!==1)throw new RuntimeException("Expected one admin-visible result");
wp_set_current_user(0);
$guest=rest_do_request($req);
if($guest->get_status()===200)throw new RuntimeException("Guest must not list inquiries");
'
echo "Forma Studio real WordPress integration checks passed"
