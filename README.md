# WordsBaking API

## Environment Variables

```
# Session Redis

SESSION_REDIS_HOST  || 'localhost'
SESSION_REDIS_PORT  || 6379
SESSION_REDIS_DB    || 0
SESSION_SECRET      || 'wordsbaking'
PORT                || 1337

# Aliyun OSS (user content)

ALIYUN_OSS_USER_CONTENT_REGION    || "oss-cn-shenzhen"
ALIYUN_OSS_USER_CONTENT_BUCKET    || "wordsbaking-dev-user-content"
ALIYUN_OSS_USER_CONTENT_KEY       || "LTAIqnjZdiSL70cH"
ALIYUN_OSS_USER_CONTENT_SECRET    || "[secret]"
ALIYUN_OSS_USER_CONTENT_INTERNAL  || "false"
```

```sh
$ cp .env.example .env
# edit environment variables
$ vi .env
```