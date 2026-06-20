const authView = document.querySelector("#auth-view");
const appView = document.querySelector("#app-view");
const authForm = document.querySelector("#auth-form");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const signInButton = document.querySelector("#signin-button");
const signUpButton = document.querySelector("#signup-button");
const logoutButton = document.querySelector("#logout-button");
const authStatus = document.querySelector("#auth-status");
const sessionStatus = document.querySelector("#session-status");

const form = document.querySelector("#post-form");
const nameInput = document.querySelector("#name");
const messageInput = document.querySelector("#message");
const counter = document.querySelector("#counter");
const postList = document.querySelector("#post-list");
const emptyState = document.querySelector("#empty-state");
const reloadButton = document.querySelector("#reload-posts");
const submitButton = document.querySelector("#submit-button");
const statusText = document.querySelector("#status");

const config = window.SUPABASE_CONFIG ?? {};
const isConfigured =
  config.url &&
  config.anonKey &&
  !config.url.includes("YOUR_SUPABASE_URL") &&
  !config.anonKey.includes("YOUR_SUPABASE_ANON_KEY");

const client = isConfigured
  ? supabase.createClient(config.url, config.anonKey)
  : null;

let posts = [];
let currentSession = null;

const setStatus = (element, message, type = "info") => {
  element.textContent = message;
  element.dataset.type = type;
};

const setBoardBusy = (isBusy) => {
  submitButton.disabled = isBusy || !currentSession;
  reloadButton.disabled = isBusy || !currentSession;
};

const setAuthBusy = (isBusy) => {
  signInButton.disabled = isBusy || !client;
  signUpButton.disabled = isBusy || !client;
};

const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const createPostElement = (post) => {
  const item = document.createElement("li");
  item.className = "post-card";

  const meta = document.createElement("div");
  meta.className = "post-meta";

  const name = document.createElement("span");
  name.className = "post-name";
  name.textContent = post.name;

  const time = document.createElement("time");
  time.className = "post-time";
  time.dateTime = post.created_at;
  time.textContent = formatTime(post.created_at);

  const message = document.createElement("p");
  message.className = "post-message";
  message.textContent = post.body;

  meta.append(name, time);
  item.append(meta, message);
  return item;
};

const renderPosts = () => {
  postList.replaceChildren(...posts.map(createPostElement));
  emptyState.classList.toggle("is-hidden", posts.length > 0);
};

const resetBoard = () => {
  posts = [];
  renderPosts();
  form.reset();
  counter.textContent = `0 / ${messageInput.maxLength}`;
  setStatus(statusText, "");
};

const updateViewForSession = (session) => {
  currentSession = session;
  authView.classList.toggle("is-hidden", Boolean(session));
  appView.classList.toggle("is-hidden", !session);
  setBoardBusy(false);
  setAuthBusy(false);

  if (!session) {
    resetBoard();
    setStatus(authStatus, client ? "ログインすると掲示板を表示できます。" : "Supabase設定を確認してください。", client ? "info" : "error");
    return;
  }

  const email = session.user?.email ?? "";
  sessionStatus.textContent = `${email} でログイン中`;
  setStatus(authStatus, "");
  fetchPosts();
};

const fetchPosts = async () => {
  if (!client || !currentSession) {
    resetBoard();
    return;
  }

  setBoardBusy(true);
  setStatus(statusText, "読み込み中です。");

  const { data, error } = await client
    .from("messages")
    .select("id, name, body, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    setStatus(statusText, `読み込みに失敗しました: ${error.message}`, "error");
    setBoardBusy(false);
    return;
  }

  posts = data ?? [];
  renderPosts();
  setStatus(statusText, "最新の投稿を表示しています。", "success");
  setBoardBusy(false);
};

const getAuthValues = () => ({
  email: emailInput.value.trim(),
  password: passwordInput.value,
});

const getAuthMessage = (error, fallback) => {
  const message = error?.message ?? "";
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("invalid login credentials")) {
    return "メールアドレスまたはパスワードが違います。Supabaseで作成したユーザーのパスワードを確認してください。";
  }

  if (lowerMessage.includes("email not confirmed")) {
    return "メール確認が未完了です。Supabaseのユーザー詳細で確認済みにするか、Email設定のConfirm emailをOFFにしてください。";
  }

  if (lowerMessage.includes("already been registered") || lowerMessage.includes("already registered")) {
    return "このメールアドレスは登録済みです。同じパスワードでログインを試します。";
  }

  return `${fallback}: ${message}`;
};

const signIn = async () => {
  if (!client) {
    setStatus(authStatus, "Supabase設定を確認してください。", "error");
    return;
  }

  const { email, password } = getAuthValues();
  if (!email || !password) {
    setStatus(authStatus, "メールアドレスとパスワードを入力してください。", "error");
    return;
  }

  setAuthBusy(true);
  setStatus(authStatus, "ログイン中です。");

  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    setStatus(authStatus, getAuthMessage(error, "ログインに失敗しました"), "error");
    setAuthBusy(false);
  }
};

const signUp = async () => {
  if (!client) {
    setStatus(authStatus, "Supabase設定を確認してください。", "error");
    return;
  }

  const { email, password } = getAuthValues();
  if (!email || !password) {
    setStatus(authStatus, "メールアドレスとパスワードを入力してください。", "error");
    return;
  }

  setAuthBusy(true);
  setStatus(authStatus, "新規登録中です。");

  const { data, error } = await client.auth.signUp({ email, password });
  if (error) {
    const authMessage = getAuthMessage(error, "新規登録に失敗しました");

    if (authMessage.includes("登録済み")) {
      setStatus(authStatus, authMessage);
      const { error: signInError } = await client.auth.signInWithPassword({ email, password });
      if (signInError) {
        setStatus(authStatus, getAuthMessage(signInError, "登録済みですがログインに失敗しました"), "error");
        setAuthBusy(false);
      }
      return;
    }

    setStatus(authStatus, authMessage, "error");
    setAuthBusy(false);
    return;
  }

  if (data.session) {
    setStatus(authStatus, "登録してログインしました。", "success");
    return;
  }

  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) {
    setStatus(authStatus, "Supabase側のメール確認が有効です。AuthenticationのEmail設定でConfirm emailをOFFにしてください。", "error");
    setAuthBusy(false);
    return;
  }
};

const signOut = async () => {
  if (!client) {
    return;
  }

  setBoardBusy(true);
  const { error } = await client.auth.signOut();
  if (error) {
    setStatus(statusText, `ログアウトに失敗しました: ${error.message}`, "error");
    setBoardBusy(false);
  }
};

messageInput.addEventListener("input", () => {
  counter.textContent = `${messageInput.value.length} / ${messageInput.maxLength}`;
});

authForm.addEventListener("submit", (event) => {
  event.preventDefault();
  signIn();
});

signUpButton.addEventListener("click", signUp);
logoutButton.addEventListener("click", signOut);
reloadButton.addEventListener("click", fetchPosts);

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!client || !currentSession) {
    setStatus(statusText, "ログインしてから投稿してください。", "error");
    return;
  }

  const name = nameInput.value.trim();
  const body = messageInput.value.trim();

  if (!name || !body) {
    setStatus(statusText, "名前と本文を入力してください。", "error");
    return;
  }

  setBoardBusy(true);
  setStatus(statusText, "送信中です。");

  const { data, error } = await client
    .from("messages")
    .insert({ name, body })
    .select("id, name, body, created_at")
    .single();

  if (error) {
    setStatus(statusText, `送信に失敗しました: ${error.message}`, "error");
    setBoardBusy(false);
    return;
  }

  posts = [data, ...posts];
  renderPosts();
  form.reset();
  counter.textContent = `0 / ${messageInput.maxLength}`;
  nameInput.focus();
  setStatus(statusText, "投稿しました。", "success");
  setBoardBusy(false);
});

if (!client) {
  updateViewForSession(null);
} else {
  client.auth.onAuthStateChange((_event, session) => {
    updateViewForSession(session);
  });

  client.auth.getSession().then(({ data }) => {
    updateViewForSession(data.session);
  });
}
