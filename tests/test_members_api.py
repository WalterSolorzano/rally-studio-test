from tests.support import auth, bootstrap, call, claim


def test_claim_returns_session_and_second_claim_fails(servidor):
    base, _ = servidor
    boot = bootstrap(base, "equipo01", "Ana")
    status, body, _ = call("POST", base + "/api/project/claim", {
        "token": boot["join_token"], "name": "Luis", "device_id": "dev-luis",
    })
    assert status == 200
    assert body["member"]["name"] == "Luis"
    assert body["session"]
    status2, _, _ = call("POST", base + "/api/project/claim", {
        "token": boot["join_token"], "name": "Otra", "device_id": "dev-x",
    })
    assert status2 == 400


def test_sections_require_session_when_project_has_members(servidor):
    base, _ = servidor
    boot = bootstrap(base, "equipo01", "Ana")
    status, _, _ = call("GET", base + "/api/sections?project=equipo01")
    assert status == 401
    status2, body2, _ = call("GET", base + "/api/sections?project=equipo01",
                             headers=auth(boot["admin_token"]))
    assert status2 == 200


def test_member_cannot_create_invite(servidor):
    base, _ = servidor
    boot = bootstrap(base, "equipo01", "Ana")
    member = claim(base, boot["join_token"], "Luis")
    status, _, _ = call("POST", base + "/api/invites?project=equipo01",
                        {"ttl_hours": 2}, headers=auth(member["session"]))
    assert status == 403


def test_admin_revokes_member_and_token_dies(servidor):
    base, _ = servidor
    boot = bootstrap(base, "equipo01", "Ana")
    member = claim(base, boot["join_token"], "Luis")
    status, _, _ = call(
        "POST",
        base + "/api/members/" + member["member"]["id"] + "/revoke?project=equipo01",
        {}, headers=auth(boot["admin_token"]),
    )
    assert status == 200
    status2, _, _ = call("GET", base + "/api/sections?project=equipo01",
                         headers=auth(member["session"]))
    assert status2 == 401


def test_project_without_members_stays_open(servidor):
    base, _ = servidor
    status, body, _ = call("GET", base + "/api/sections?project=main")
    assert status == 200
    assert body["ok"] is True


def test_admin_can_create_invite_and_list_members(servidor):
    base, _ = servidor
    boot = bootstrap(base, "equipo01", "Ana")
    status, body, _ = call("POST", base + "/api/invites?project=equipo01",
                           {"ttl_hours": 2}, headers=auth(boot["admin_token"]))
    assert status == 200
    assert body["url_path"].startswith("join.html?t=")
    status2, body2, _ = call("GET", base + "/api/members?project=equipo01",
                             headers=auth(boot["admin_token"]))
    assert status2 == 200
    assert len(body2["members"]) == 1
    assert "token" not in body2["members"][0]
