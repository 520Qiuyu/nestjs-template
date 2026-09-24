# qiuyu520.fun 通配符证书手动更新

域名在阿里云，服务器在火山。用官方镜像 `certbot/certbot` 做 DNS 校验，在阿里云控制台手工添加 TXT。证书写在宿主机 `/etc/letsencrypt`，由 `cloudmusic-nginx` 只读挂载。

证书覆盖：

- `qiuyu520.fun`
- `*.qiuyu520.fun`（含 `www.qiuyu520.fun`、`qishui.qiuyu520.fun`）

DNS 只保留实际要访问的 A 记录，例如 `qishui.qiuyu520.fun`。不用添加 `*.qiuyu520.fun` 泛解析。

Let's Encrypt 证书约 90 天过期。到期前在服务器上再执行一次下面的命令，按提示改 TXT。

## 手动更新

在火山服务器上执行。必须加 `-it`，中途要去阿里云改解析。

```bash
docker run -it --rm --name certbot \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/lib/letsencrypt:/var/lib/letsencrypt \
  certbot/certbot certonly \
  --manual \
  --preferred-challenges dns \
  --cert-name qiuyu520.fun \
  --force-renewal \
  -d qiuyu520.fun \
  -d "*.qiuyu520.fun"
```

`--cert-name qiuyu520.fun` 会覆盖现有证书，Nginx 里的证书路径不用改。

容器会暂停，并给出 TXT 的值。根域名和通配符都校验 `_acme-challenge.qiuyu520.fun`，通常要加两条，两条都保留：

| 主机记录 | 类型 | 值 |
|---|---|---|
| `_acme-challenge` | TXT | 容器给出的第一段 |
| `_acme-challenge` | TXT | 容器给出的第二段 |

在阿里云云解析里保存后，另开一个终端确认已经能查到，再回到容器按回车：

```bash
dig TXT _acme-challenge.qiuyu520.fun +short
```

成功后核对域名并重载 Nginx：

```bash
sudo openssl x509 -in /etc/letsencrypt/live/qiuyu520.fun/fullchain.pem -noout -text | grep DNS
docker exec cloudmusic-nginx nginx -s reload
```

`DNS:` 中应有 `qiuyu520.fun` 和 `*.qiuyu520.fun`。
