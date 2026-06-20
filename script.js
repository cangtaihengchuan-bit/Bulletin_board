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

const setStatus = (message, type = "info") => {
  statusText.textContent = message;
  statusText.dataset.type = type;
};

const setBusy = (isBusy) => {
  submitButton.disabled = isBusy || !client;
  reloadButton.disabled = isBusy || !client;
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

const fetchPosts = async () => {
  if (!client) {
    setStatus("SupabaseのURLとanon keyを supabase-config.js に設定してください。", "error");
    setBusy(false);
    return;
  }

  setBusy(true);
  setStatus("読み込み中です。");

  const { data, error } = await client
    .from("messages")
    .select("id, name, body, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    setStatus(`読み込みに失敗しました: ${error.message}`, "error");
    setBusy(false);
    return;
  }

  posts = data ?? [];
  renderPosts();
  setStatus("最新の投稿を表示しています。", "success");
  setBusy(false);
};

messageInput.addEventListener("input", () => {
  counter.textContent = `${messageInput.value.length} / ${messageInput.maxLength}`;
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!client) {
    setStatus("Supabase設定が未入力のため、送信できません。", "error");
    return;
  }

  const name = nameInput.value.trim();
  const body = messageInput.value.trim();

  if (!name || !body) {
    setStatus("名前と本文を入力してください。", "error");
    return;
  }

  setBusy(true);
  setStatus("送信中です。");

  const { data, error } = await client
    .from("messages")
    .insert({ name, body })
    .select("id, name, body, created_at")
    .single();

  if (error) {
    setStatus(`送信に失敗しました: ${error.message}`, "error");
    setBusy(false);
    return;
  }

  posts = [data, ...posts];
  renderPosts();
  form.reset();
  counter.textContent = `0 / ${messageInput.maxLength}`;
  nameInput.focus();
  setStatus("投稿しました。", "success");
  setBusy(false);
});

reloadButton.addEventListener("click", fetchPosts);

renderPosts();
fetchPosts();
