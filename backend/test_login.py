import urllib.request
import urllib.error
import json

def test_login(username, password):
    data = json.dumps({"username": username, "password": password}).encode()
    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/auth/login/",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        r = urllib.request.urlopen(req)
        body = json.loads(r.read())
        print(f"[OK] {username}: token={body.get('token', '')[:20]}... user={body.get('user', {}).get('username')}")
    except urllib.error.HTTPError as e:
        body = e.read()
        print(f"[FAIL {e.code}] {username}: {body}")

test_login("admin", "admin123")
test_login("user", "user123")
