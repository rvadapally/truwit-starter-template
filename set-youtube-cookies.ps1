# Set YouTube cookies in the database

$cookiesContent = @"
# Netscape HTTP Cookie File
# https://curl.haxx.se/rfc/cookie_spec.html
# This is a generated file! Do not edit.

.youtube.com	TRUE	/	TRUE	1795146089	PREF	f6=80&tz=America.Chicago&f4=4000000&f5=30000&f7=100
.youtube.com	TRUE	/	FALSE	1794785358	SID	g.a0002QiDIGxHNbegA1VTobcG6SCNbT6ybTngB0zAYiv2s8hhJibWBBYXm1GTxtAmgE5PHrXxmQACgYKASwSARASFQHGX2MiJIDBq-KUKdhIyue9EOcN8BoVAUF8yKr98S2319TXLE9mumHvdw8M0076
.youtube.com	TRUE	/	TRUE	1794785358	__Secure-1PSID	g.a0002QiDIGxHNbegA1VTobcG6SCNbT6ybTngB0zAYiv2s8hhJibW2_WXccSyjFbiQLqA2tp1BAACgYKAWsSARASFQHGX2MiwOs5CtyANoHkozotuc8CVxoVAUF8yKqt_-yJzAB78wIcmd3sWp9c0076
.youtube.com	TRUE	/	TRUE	1794785358	__Secure-3PSID	g.a0002QiDIGxHNbegA1VTobcG6SCNbT6ybTngB0zAYiv2s8hhJibWU7q7dpOrEzc67DATL-Ed0gACgYKAXESARASFQHGX2Mi2ie4v57ZBduP_WZOg4qnQRoVAUF8yKpgV7D4pOhoO2OrhDP13Nis0076
.youtube.com	TRUE	/	FALSE	1794785358	HSID	AS4cDZnPB30jyE6n8
.youtube.com	TRUE	/	TRUE	1794785358	SSID	AuhTFzUCK7irka3_n
.youtube.com	TRUE	/	FALSE	1794785358	APISID	y7qVrzKgEKJsQNMi/AXo4g059tFcI44Jm8
.youtube.com	TRUE	/	TRUE	1794785358	SAPISID	fFYT3Hq7UgCzg6Bn/Af1P6k11G0elpb7C9
.youtube.com	TRUE	/	TRUE	1794785358	__Secure-1PAPISID	fFYT3Hq7UgCzg6Bn/Af1P6k11G0elpb7C9
.youtube.com	TRUE	/	TRUE	1794785358	__Secure-3PAPISID	fFYT3Hq7UgCzg6Bn/Af1P6k11G0elpb7C9
.youtube.com	TRUE	/	TRUE	1794818320	LOGIN_INFO	AFmmF2swRQIgKEr7grTR7XzuyGKAoQBNfxfIcr8TDA87UogOFivKcTICIQDdrNjlLmqadQMx66Q6U2MMLmoQj1CQlI6XqENzXwn5NQ:QUQ3MjNmd19DMzMwVHY3UTVUVzlYdTF4NDhNQ3dQT05zSmkxMUEwWnJnV2dUZnc3MVk5UUZUdEQyaDh6N1d4aTFaNktwLUZjdV9CdVdmRjVoOG5Tbk9JYjVXbFdxeUhDT1QzVXAyNkh1c2x5UlRFMkEzWVpOVkFzdVdxc0tvcVZrckx3YlhLd08zcEZucUZxUEZadlRrYmQxaGU0bzhmOS03cUNob2VxZWFvTVJkNUNmOENDWWxGNWZrYWo1ZWh3eXdRQUQ3RWVPYnQ2cE1JLXo1cW5jblFGS1cxT0Fnall5QQ==
.youtube.com	TRUE	/	TRUE	1792122002	__Secure-1PSIDTS	sidts-CjQBmkD5S6Y4772sj1C4EcQlDohFMi7OFZe-gwF7Q8tUBS7Ve7OEDG8pD7JwArYSrcDimfuxEAA
.youtube.com	TRUE	/	TRUE	1792122002	__Secure-3PSIDTS	sidts-CjQBmkD5S6Y4772sj1C4EcQlDohFMi7OFZe-gwF7Q8tUBS7Ve7OEDG8pD7JwArYSrcDimfuxEAA
.youtube.com	TRUE	/	FALSE	1760586094	ST-xuwub9	session_logininfo=AFmmF2swRQIgKEr7grTR7XzuyGKAoQBNfxfIcr8TDA87UogOFivKcTICIQDdrNjlLmqadQMx66Q6U2MMLmoQj1CQlI6XqENzXwn5NQ%3AQUQ3MjNmd19DMzMwVHY3UTVUVzlYdTF4NDhNQ3dQT05zSmkxMUEwWnJnV2dUZnc3MVk5UUZUdEQyaDh6N1d4aTFaNktwLUZjdV9CdVdmRjVoOG5Tbk9JYjVXbFdxeUhDT1QzVXAyNkh1c2x5UlRFMkEzWVpOVkFzdVdxc0tvcVZrckx3YlhLd08zcEZucUZxUEZadlRrYmQxaGU0bzhmOS03cUNob2VxZWFvTVJkNUNmOENDWWxGNWZrYWo1ZWh3eXdRQUQ3RWVPYnQ2cE1JLXo1cW5jblFGS1cxT0Fnall5QQ%3D%3D
.youtube.com	TRUE	/	FALSE	1792122091	SIDCC	AKEyXzX7BburW3UPnre3nie9t7Zz5KVeTPuhUi1deH-nMNYYo7P4YBHjyqyeQhmtzdqVg_XkIw
.youtube.com	TRUE	/	TRUE	1792122091	__Secure-1PSIDCC	AKEyXzUxSzQ9hwepfH90KsgtkF45jbOFYQqZ54C_s0B0xkuWwoZCJonM9dzXwycCsXihlC75hw
.youtube.com	TRUE	/	TRUE	1792122091	__Secure-3PSIDCC	AKEyXzXjPSdy-5SVaKv50iL0uuftdmWR5jksdwYH1_IfkQ5ARV8MS6fZWBxWZwTIXm2GM857FQ
.youtube.com	TRUE	/	TRUE	1776138087	VISITOR_INFO1_LIVE	rnN9dcgUg2s
.youtube.com	TRUE	/	TRUE	1776138087	VISITOR_PRIVACY_METADATA	CgJVUxIEGgAgPA%3D%3D
.youtube.com	TRUE	/	TRUE	0	YSC	nvagr60gx54
.youtube.com	TRUE	/	TRUE	1776131444	__Secure-ROLLOUT_TOKEN	CLOh66GjtM27URCB8NPNu56MAxjzgovDzaeQAw%3D%3D
"@

Write-Host "Uploading YouTube cookies to database..." -ForegroundColor Cyan

$body = @{
    Value = $cookiesContent
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod `
        -Uri "https://truwit-starter-template-production.up.railway.app/v1/admin/settings/YOUTUBE_COOKIES" `
        -Method Put `
        -Body $body `
        -ContentType "application/json; charset=utf-8" `
        -TimeoutSec 30
    
    Write-Host "✅ Cookies uploaded successfully!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Upload failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "Error details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
}

Write-Host "`nNow test with a YouTube video!" -ForegroundColor Green

