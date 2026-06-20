# Bulletin Board

Supabaseをデータベースとして使う、ひとこと掲示板です。

## Runtime files

- `index.html`
- `style.css`
- `script.js`
- `supabase-config.js`

GitHub Pagesで公開すると、Supabaseの`messages`テーブルから投稿を読み込み、新しい投稿を追加できます。

## Auth

メールアドレスとパスワードによるSupabase Authログインが必要です。

`supabase-auth-policies.sql`をSupabaseのSQL Editorで実行すると、未ログインユーザーは`messages`の閲覧と投稿ができなくなります。
