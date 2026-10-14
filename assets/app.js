(() => {
  "use strict";

  const DATA = window.DEMO_DATA;
  const STORAGE_KEY = "tuanwei-v002-pages-demo-state";
  const defaultState = {
    specialty: "全部专业",
    sort: "latest",
    query: "",
    loggedIn: false,
    bookmarks: [],
    likes: [],
    helpful: [],
    readNotifications: [],
    localQuestions: [],
    localAnswers: {},
    reportStatus: {},
    joinedActivities: [],
  };
  let state = loadState();
  let toastTimer;
  let searchRenderTimer;

  const app = document.querySelector("#app");
  const toast = document.querySelector("#toast");
  const modalRoot = document.querySelector("#modal-root");

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      return saved && typeof saved === "object" ? { ...defaultState, ...saved } : { ...defaultState };
    } catch {
      return { ...defaultState };
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
    })[char]);
  }

  function icon(name, size = 18) {
    const paths = {
      home: '<path d="M3 10.5 12 3l9 7.5v9a1.5 1.5 0 0 1-1.5 1.5H15v-6H9v6H4.5A1.5 1.5 0 0 1 3 19.5z"/>',
      search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
      plus: '<path d="M12 5v14M5 12h14"/>',
      bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
      user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
      back: '<path d="m15 18-6-6 6-6"/>',
      eye: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/>',
      chat: '<path d="M21 12a8 8 0 0 1-8 8H6l-4 2 1.4-4.2A9 9 0 1 1 21 12Z"/>',
      bookmark: '<path d="M6 3h12v18l-6-4-6 4z"/>',
      heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.7-7.5 1.1-1.1a5.5 5.5 0 0 0 0-7.8Z"/>',
      check: '<path d="m5 12 4 4L19 6"/>',
      close: '<path d="m6 6 12 12M18 6 6 18"/>',
      shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
      filter: '<path d="M4 5h16M7 12h10M10 19h4"/>',
      arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
    };
    return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.arrow}</svg>`;
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function openModal(content) {
    modalRoot.innerHTML = `<div class="modal-backdrop" data-close-modal><section class="modal" role="dialog" aria-modal="true">${content}</section></div>`;
    modalRoot.querySelector(".modal")?.addEventListener("click", (event) => event.stopPropagation());
  }

  function closeModal() { modalRoot.innerHTML = ""; }

  function routeTo(route) {
    window.location.hash = route.startsWith("#") ? route : `#/${route.replace(/^\//, "")}`;
  }

  function currentRoute() {
    const route = window.location.hash.replace(/^#\/?/, "") || "home";
    const [page, id] = route.split("/");
    return { page, id };
  }

  function allQuestions() {
    return [...state.localQuestions, ...DATA.questions];
  }

  function statusText(status) {
    return ({ resolved: "已解决", discussing: "讨论中", waiting: "待回答" })[status] || "讨论中";
  }

  function filteredQuestions({ query = state.query, specialty = state.specialty, sort = state.sort } = {}) {
    const normalized = query.trim().toLocaleLowerCase("zh-CN");
    const result = allQuestions().filter((question) => {
      const matchesSpecialty = specialty === "全部专业" || question.specialty === specialty;
      const haystack = [question.title, question.body, question.course, question.specialty, ...(question.tags || [])].join(" ").toLocaleLowerCase("zh-CN");
      return matchesSpecialty && (!normalized || haystack.includes(normalized));
    });
    if (sort === "popular") return result.sort((a, b) => (b.views + b.likes * 5 + b.answers.length * 24) - (a.views + a.likes * 5 + a.answers.length * 24));
    if (sort === "waiting") return result.sort((a, b) => (a.answers.length - b.answers.length) || (a.age - b.age));
    return result.sort((a, b) => a.age - b.age);
  }

  function demoRibbon() {
    return `<div class="demo-ribbon"><strong>STATIC DEMO</strong> 全部帖子、账号、活动与数据均为虚构模拟 · 不连接服务器</div>`;
  }

  function bottomNav(active) {
    const items = [
      ["home", "home", "首页"],
      ["search", "search", "搜索"],
      ["ask", "plus", "提问"],
      ["notifications", "bell", "消息"],
      ["profile", "user", "我的"],
    ];
    return `<nav class="bottom-nav" aria-label="演示站主要导航">${items.map(([route, iconName, label]) => `
      <button class="nav-button ${route === active ? "active" : ""} ${route === "ask" ? "ask" : ""}" data-route="${route}" aria-label="${label}">
        <span class="nav-icon">${icon(iconName, route === "ask" ? 21 : 19)}</span><span>${label}</span>
      </button>`).join("")}</nav>`;
  }

  function specialtyChips() {
    return `<div class="chip-row" aria-label="专业分类">
      ${["全部专业", ...DATA.specialties].map((specialty) => `<button class="chip ${state.specialty === specialty ? "active" : ""}" data-specialty="${escapeHtml(specialty)}">${escapeHtml(specialty)}</button>`).join("")}
    </div>`;
  }

  function sortBar() {
    return `<div class="sort-bar"><div class="sort-tabs">
      <button class="sort-tab ${state.sort === "latest" ? "active" : ""}" data-sort="latest">最新</button>
      <button class="sort-tab ${state.sort === "popular" ? "active" : ""}" data-sort="popular">热门</button>
      <button class="sort-tab ${state.sort === "waiting" ? "active" : ""}" data-sort="waiting">待回答</button>
    </div><span class="demo-caption">SIMULATED FEED</span></div>`;
  }

  function searchBox(value = state.query, autofocus = false) {
    return `<label class="search-box">${icon("search", 18)}<input id="question-search" type="search" maxlength="50" value="${escapeHtml(value)}" placeholder="搜索课程、知识点、实验或问题" ${autofocus ? "autofocus" : ""} aria-label="搜索模拟问题"/><button class="clear-search ${value ? "" : "hidden"}" data-clear-search aria-label="清空搜索">${icon("close", 16)}</button></label>`;
  }

  function questionCard(question, index) {
    const answerCount = [...(question.answers || []), ...(state.localAnswers[question.id] || [])].length;
    return `<article class="question-card" data-status="${question.status}">
      <button class="question-hit" data-route="question/${encodeURIComponent(question.id)}">
        <div class="question-topline"><span class="serial">Q-${String(index + 1).padStart(3, "0")}</span><span class="status-pill ${question.status}">${statusText(question.status)}</span></div>
        <h3>${escapeHtml(question.title)}</h3>
        <div class="tag-line"><span class="tag course">${escapeHtml(question.course)}</span><span class="tag">${escapeHtml(question.specialty)}</span>${(question.tags || []).slice(0, 1).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
        <p class="question-excerpt">${escapeHtml(question.body)}</p>
        <div class="card-meta"><span class="author-dot">${escapeHtml(question.author.slice(-1))}</span><span class="author">${escapeHtml(question.author)} · ${escapeHtml(question.time)}</span><span class="metric">${icon("chat", 13)} ${answerCount}</span><span class="metric">${icon("eye", 13)} ${question.views}</span></div>
      </button>
    </article>`;
  }

  function feedMarkup(questions) {
    if (!questions.length) return `<div class="empty-state"><div class="empty-orbit"></div><h3>没有匹配的模拟问题</h3><p>换一个关键词或专业分类试试。这里不会从真实服务器读取内容。</p></div>`;
    return `<div class="question-list">${questions.map(questionCard).join("")}</div>`;
  }

  function homePage() {
    const questions = filteredQuestions();
    return `${demoRibbon()}<main class="app-main page-enter">
      <header class="home-hero">
        <div class="hero-top"><div><h1 class="college-title">材料科学与工程学院</h1><p class="college-en">SCHOOL OF MATERIALS SCIENCE<br/>AND ENGINEERING · STUDENT DEMO</p></div><div class="hero-tools"><button class="icon-button" data-route="search" aria-label="搜索">${icon("search",20)}</button><button class="avatar-button" data-login aria-label="Demo 登录">${state.loggedIn ? "访" : "D"}</button></div></div>
        <p class="hero-note">Explore · Build · Create</p>
        <div class="quick-grid">
          <button class="quick-card" data-scroll-feed><span class="quick-icon"></span><b>学习互助</b><small>STUDY · 核心</small></button>
          <button class="quick-card" data-route="simulator"><span class="quick-icon"></span><b>专业分流</b><small>SIMULATOR</small></button>
          <button class="quick-card" data-route="resources"><span class="quick-icon"></span><b>学习资源</b><small>RESOURCES</small></button>
          <button class="quick-card" data-route="activities"><span class="quick-icon"></span><b>团委活动</b><small>EVENTS · 模拟</small></button>
        </div>
      </header>
      <section class="feed-panel" id="learning-feed">
        <div class="section-head"><div><p class="eyebrow">Learning Exchange / 01</p><h2>学习互助</h2><p>有问题，就在这里找到思路。</p></div><span class="result-count">${questions.length} 条模拟内容</span></div>
        ${searchBox()}${specialtyChips()}${sortBar()}${feedMarkup(questions)}
        <p class="screen-note">本页面全部问答均为独立编写的演示数据，不代表学院官方答复。</p>
      </section>
    </main>${bottomNav("home")}`;
  }

  function topHeader(title, back = "home", action = "") {
    return `<header class="top-header"><button class="back-button" data-route="${back}" aria-label="返回">${icon("back",20)}</button><h1>${escapeHtml(title)}</h1>${action || '<span class="spacer"></span>'}</header>`;
  }

  function searchPage() {
    const questions = filteredQuestions();
    return `${demoRibbon()}<main class="app-main paper-page page-enter">${topHeader("搜索", "home", `<button class="header-action" data-reset-filters aria-label="重置筛选">${icon("filter",18)}</button>`)}<section class="page-body">
      <div class="section-head"><div><p class="eyebrow">SEARCH / 06</p><h2>查找学习问题</h2><p>搜索标题、正文、课程与标签。</p></div><span class="result-count">${questions.length} 条</span></div>
      ${searchBox(state.query, true)}${specialtyChips()}${sortBar()}${feedMarkup(questions)}
    </section></main>${bottomNav("search")}`;
  }

  function questionPage(id) {
    const question = allQuestions().find((item) => item.id === id);
    if (!question) return notFoundPage();
    const answers = [...(question.answers || []), ...(state.localAnswers[id] || [])];
    const bookmarked = state.bookmarks.includes(id);
    const liked = state.likes.includes(id);
    return `${demoRibbon()}<main class="app-main paper-page page-enter">${topHeader("帖子详情", "home", `<button class="header-action" data-demo-report="${escapeHtml(id)}" aria-label="举报演示">···</button>`)}
      <article class="detail-question"><div class="question-topline"><span class="serial">POST DETAIL · DEMO</span><span class="status-pill ${question.status}">${statusText(question.status)}</span></div><h2>${escapeHtml(question.title)}</h2><div class="tag-line"><span class="tag course">${escapeHtml(question.course)}</span><span class="tag">${escapeHtml(question.specialty)}</span>${(question.tags || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div><div class="detail-meta"><span class="author-dot">${escapeHtml(question.author.slice(-1))}</span><b>${escapeHtml(question.author)}</b><span>${escapeHtml(question.time)}</span><span>· 模拟身份</span></div><p class="body-copy">${escapeHtml(question.body)}</p>
      <div class="action-strip"><button class="action-button ${liked ? "active" : ""}" data-like="${escapeHtml(id)}">${icon("heart",15)} ${liked ? question.likes + 1 : question.likes} 有帮助</button><button class="action-button ${bookmarked ? "active" : ""}" data-bookmark="${escapeHtml(id)}">${icon("bookmark",15)} ${bookmarked ? "已收藏" : "收藏"}</button><button class="action-button" data-demo-share>${icon("arrow",15)} 分享演示</button></div></article>
      <section class="answer-section"><div class="answer-heading"><h3>回答 ${answers.length}</h3><span>有效回答优先展示</span></div>
      ${answers.length ? answers.map((answer, index) => answerCard(answer, id, index)).join("") : `<div class="empty-state"><div class="empty-orbit"></div><h3>还没有模拟回答</h3><p>来写第一条演示回答。内容只保存在当前浏览器。</p></div>`}
      <button class="primary-button full" data-answer="${escapeHtml(id)}">写一条演示回答</button></section>
    </main>`;
  }

  function answerCard(answer, questionId, index) {
    const key = `${questionId}:${index}`;
    const active = state.helpful.includes(key);
    return `<article class="answer-card ${answer.accepted ? "accepted" : ""}">${answer.accepted ? '<span class="answer-label">✓ 已采纳 · 模拟状态</span>' : ""}<div class="answer-author"><span class="author-dot">${escapeHtml(answer.author.slice(-1))}</span><b>${escapeHtml(answer.author)}</b><time>${escapeHtml(answer.time)}</time></div><p class="answer-body">${escapeHtml(answer.body)}</p><button class="helpful-button ${active ? "active" : ""}" data-helpful="${escapeHtml(key)}">${icon("heart",14)} ${active ? answer.helpful + 1 : answer.helpful} 有帮助</button></article>`;
  }

  function askPage() {
    return `${demoRibbon()}<main class="app-main paper-page page-enter">${topHeader("发布提问", "home")}<section class="page-body"><div class="page-intro"><p class="eyebrow">NEW QUESTION / DEMO</p><h2>把问题说清楚，答案才更容易留下来。</h2><p>此页面仅模拟发布体验，提交内容只保存在当前浏览器，不会进入任何服务器或学院平台。</p></div><div class="hint-card">先搜索是否已有类似问题；问题尽量具体；不要填写真实姓名、学号、手机号、实验室隐私或未公开数据。</div>
      <form id="ask-form" class="form-card" novalidate>
        <label class="field" data-field="title"><span class="field-label">问题标题 <small><span data-title-count>0</span>/80</small></span><input name="title" maxlength="80" placeholder="用一句话描述你的学习问题"/><span class="field-error">标题至少需要 8 个字。</span></label>
        <label class="field" data-field="body"><span class="field-label">详细描述 <small><span data-body-count>0</span>/800</small></span><textarea name="body" maxlength="800" placeholder="说说你已经尝试过什么、具体卡在哪里、希望得到哪类答案。"></textarea><span class="field-error">描述至少需要 30 个字。</span></label>
        <label class="field"><span class="field-label">专业分类 <small>必选</small></span><select name="specialty">${DATA.specialties.map((item) => `<option>${escapeHtml(item)}</option>`).join("")}</select></label>
        <label class="field" data-field="course"><span class="field-label">课程或主题标签 <small>2–16 字</small></span><input name="course" maxlength="16" placeholder="例如：材料热力学"/><span class="field-error">请填写课程或主题标签。</span></label>
        <button class="primary-button full" type="submit">发布到本浏览器 Demo</button>
      </form><p class="screen-note">提交即代表你理解：这不是正式平台，刷新后数据仍可能因浏览器清理而消失。</p></section></main>${bottomNav("ask")}`;
  }

  function notificationsPage() {
    return `${demoRibbon()}<main class="app-main paper-page page-enter">${topHeader("通知消息", "home", '<button class="header-action" data-read-all aria-label="全部已读">✓</button>')}<section class="page-body"><div class="section-head"><div><p class="eyebrow">NOTIFICATIONS / 09</p><h2>演示通知</h2><p>不会从真实账号同步。</p></div></div><div class="list-panel">${DATA.notifications.map((item, index) => { const read = state.readNotifications.includes(index) || !item.unread; return `<button class="list-row" data-read-notification="${index}"><span class="row-icon ${read ? "blue" : ""}">${read ? "✓" : "•"}</span><span class="row-copy"><b>${escapeHtml(item.title)}</b><p>${escapeHtml(item.type)} · ${escapeHtml(item.time)}</p></span><span class="row-tail">${read ? "已读" : "未读"}</span></button>`; }).join("")}</div><p class="screen-note">回答、采纳和系统提醒均为预置模拟，不代表真实事件。</p></section></main>${bottomNav("notifications")}`;
  }

  function profilePage() {
    const published = state.localQuestions.length;
    return `${demoRibbon()}<main class="app-main paper-page page-enter"><section class="profile-visual"><div class="profile-card"><div class="profile-avatar">访</div><div><h2>${state.loggedIn ? "Demo 访客" : "未登录演示身份"}</h2><p>PUBLIC PROFILE · 本地临时状态</p><span class="profile-badge">静态演示 · 非学院身份认证</span></div></div><div class="stat-grid"><div class="stat"><b>${published}</b><small>本地提问</small></div><div class="stat"><b>${Object.values(state.localAnswers).flat().length}</b><small>本地回答</small></div><div class="stat"><b>${state.bookmarks.length}</b><small>收藏</small></div><div class="stat"><b>${state.helpful.length}</b><small>有帮助</small></div></div></section><section class="page-body">
      <div class="list-panel"><button class="list-row" data-login><span class="row-icon">${state.loggedIn ? "退" : "登"}</span><span class="row-copy"><b>${state.loggedIn ? "退出 Demo 身份" : "进入 Demo 身份"}</b><p>不需要用户名或密码，不创建真实账号</p></span><span class="row-tail">›</span></button><button class="list-row" data-show-bookmarks><span class="row-icon blue">★</span><span class="row-copy"><b>我的收藏</b><p>${state.bookmarks.length} 条，仅保存在当前浏览器</p></span><span class="row-tail">›</span></button><button class="list-row" data-route="admin"><span class="row-icon">管</span><span class="row-copy"><b>管理员工作台 Demo</b><p>演示举报处理，不具备真实权限</p></span><span class="row-tail">›</span></button><button class="list-row" data-clear-demo><span class="row-icon blue">清</span><span class="row-copy"><b>清除本地演示状态</b><p>删除本浏览器的收藏、点赞和发布内容</p></span><span class="row-tail">›</span></button><button class="list-row" data-route="more"><span class="row-icon blue">···</span><span class="row-copy"><b>更多与说明</b><p>平台介绍、使用边界和演示声明</p></span><span class="row-tail">›</span></button></div>
    </section></main>${bottomNav("profile")}`;
  }

  function adminPage() {
    const reports = DATA.reports.map((report) => ({ ...report, status: state.reportStatus[report.id] || report.status }));
    return `${demoRibbon()}<main class="app-main paper-page page-enter">${topHeader("管理员工作台", "profile")}<section class="admin-stage"><p class="eyebrow">ADMIN CONSOLE / DEMO ONLY</p><h2>内容治理演示</h2><p>这里没有真实管理员身份、权限令牌或服务端操作。按钮仅改变当前浏览器里的模拟状态。</p><div class="admin-kpis"><div class="kpi"><b>${reports.filter((item) => item.status === "待处理").length}</b><span>待处理</span></div><div class="kpi"><b>${reports.filter((item) => item.status === "复核中").length}</b><span>复核中</span></div><div class="kpi"><b>${reports.filter((item) => item.status === "已处理").length}</b><span>已处理</span></div></div></section><section class="page-body"><div class="list-panel">${reports.map((report) => `<article class="report-card"><div class="report-card-head"><h3>${escapeHtml(report.target)}</h3><span class="status-pill ${report.status === "已处理" ? "" : "discussing"}">${escapeHtml(report.status)}</span></div><p>${escapeHtml(report.reason)} · SIMULATED REPORT</p><div class="report-actions"><button class="mini-button" data-report-action="review" data-report-id="${report.id}">标记复核</button><button class="mini-button danger" data-report-action="resolve" data-report-id="${report.id}">模拟处理</button></div></article>`).join("")}</div><p class="screen-note">正式版管理员 API、AuditLog 与权限校验不在此静态站运行。</p></section></main>`;
  }

  function resourcesPage() {
    return `${demoRibbon()}<main class="app-main paper-page page-enter">${topHeader("学习资源", "home")}<section class="page-body"><div class="page-intro"><p class="eyebrow">RESOURCES / 07</p><h2>从问题走向可复用的学习资料。</h2><p>资源条目均为演示描述，不提供未经授权的课件、教材或下载文件。</p></div><div class="list-panel">${DATA.resources.map((resource, index) => `<article class="resource-card"><div class="resource-thumb"></div><div><h3>${escapeHtml(resource.title)}</h3><p>${escapeHtml(resource.summary)}</p><small>${escapeHtml(resource.category)} · ${escapeHtml(resource.meta)}</small><button class="mini-button" data-resource-save="${index}">收藏演示</button></div></article>`).join("")}</div></section></main>${bottomNav("home")}`;
  }

  function activitiesPage() {
    return `${demoRibbon()}<main class="app-main paper-page page-enter">${topHeader("团委活动", "home")}<section class="page-body"><div class="section-head"><div><p class="eyebrow">EVENTS / 05</p><h2>活动前瞻与反馈</h2><p>以下均为视觉与交互模拟，不是官方通知。</p></div></div>${DATA.activities.map((activity, index) => { const joined = state.joinedActivities.includes(index); return `<article class="activity-card"><span class="activity-status">${joined ? "已加入 Demo" : escapeHtml(activity.status)}</span><div class="activity-date">${escapeHtml(activity.date)}</div><h3>${escapeHtml(activity.title)}</h3><p>${escapeHtml(activity.meta)} · ${escapeHtml(activity.place)}<br/>${escapeHtml(activity.summary)}</p><button class="mini-button ${joined ? "done" : ""}" data-join-activity="${index}">${joined ? "取消演示报名" : "演示报名"}</button></article>`; }).join("")}</section></main>${bottomNav("home")}`;
  }

  function simulatorPage() {
    return `${demoRibbon()}<main class="app-main paper-page page-enter">${topHeader("专业分流模拟器", "home")}<section class="page-body"><div class="page-intro"><p class="eyebrow">SIMULATOR / 04</p><h2>原项目接入中</h2><p>静态演示版不编造分流算法、参数或预测结果。后续仅在保留原项目算法和数据逻辑的前提下进行整合。</p></div><div class="list-panel"><div class="list-row"><span class="row-icon">01</span><span class="row-copy"><b>兴趣评估</b><p>等待原模拟器项目接入</p></span><span class="row-tail">未启用</span></div><div class="list-row"><span class="row-icon blue">02</span><span class="row-copy"><b>能力匹配</b><p>不生成虚假的方向建议</p></span><span class="row-tail">未启用</span></div><div class="list-row"><span class="row-icon">03</span><span class="row-copy"><b>结果分析</b><p>模拟结果仅供娱乐与辅助理解</p></span><span class="row-tail">未启用</span></div></div></section></main>${bottomNav("home")}`;
  }

  function morePage() {
    const rows = [["平台介绍","围绕学习互助构建的学生服务平台 Demo"],["使用指南","筛选、搜索、收藏与本地发布说明"],["常见问题","为什么这里没有真实登录和数据库"],["隐私说明","不收集、不上传、不共享个人数据"],["社区规则","演示草案，不代表正式生效版本"],["版本信息","V002 GitHub Pages Static Demo"]];
    return `${demoRibbon()}<main class="app-main paper-page page-enter">${topHeader("更多功能", "profile")}<section class="page-body"><div class="list-panel">${rows.map(([title,desc],index) => `<button class="list-row" data-info="${index}"><span class="row-icon ${index % 2 ? "blue" : ""}">${String(index + 1).padStart(2,"0")}</span><span class="row-copy"><b>${title}</b><p>${desc}</p></span><span class="row-tail">›</span></button>`).join("")}</div><p class="screen-note">协议、隐私政策与社区规则仅为演示说明，不声称已通过学院审核。</p></section></main>`;
  }

  function notFoundPage() {
    return `${demoRibbon()}<main class="app-main paper-page page-enter">${topHeader("页面未找到", "home")}<section class="page-body"><div class="empty-state"><div class="empty-orbit"></div><h3>这个演示页面不存在</h3><p>Hash 路由可能被修改，返回首页继续体验。</p><button class="primary-button" data-route="home">返回首页</button></div></section></main>`;
  }

  function render() {
    const { page, id } = currentRoute();
    const pages = {
      home: homePage,
      search: searchPage,
      ask: askPage,
      notifications: notificationsPage,
      profile: profilePage,
      admin: adminPage,
      resources: resourcesPage,
      activities: activitiesPage,
      simulator: simulatorPage,
      more: morePage,
    };
    app.innerHTML = page === "question" ? questionPage(decodeURIComponent(id || "")) : (pages[page] || notFoundPage)();
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function askForDemoLogin() {
    if (state.loggedIn) {
      openModal(`<p class="eyebrow">DEMO IDENTITY</p><h2>退出 Demo 身份？</h2><p>收藏、点赞和本地发布内容仍会保留，但页面会显示为未登录演示状态。</p><div class="modal-actions"><button class="secondary-button" data-close-modal>取消</button><button class="primary-button" data-confirm-logout>退出</button></div>`);
    } else {
      openModal(`<p class="eyebrow">LOCAL DEMO LOGIN</p><h2>进入 Demo 访客身份</h2><p>无需用户名、手机号或密码。状态只保存在本浏览器，不创建账号，也不会发送到服务器。</p><div class="modal-actions"><button class="secondary-button" data-close-modal>暂不进入</button><button class="primary-button" data-confirm-login>进入 Demo</button></div>`);
    }
  }

  function requireLogin(message = "此演示操作需要先进入 Demo 访客身份。") {
    if (state.loggedIn) return true;
    openModal(`<p class="eyebrow">DEMO ONLY</p><h2>先进入本地演示身份</h2><p>${escapeHtml(message)} 不需要真实账号或密码。</p><div class="modal-actions"><button class="secondary-button" data-close-modal>取消</button><button class="primary-button" data-confirm-login>进入 Demo</button></div>`);
    return false;
  }

  document.addEventListener("click", (event) => {
    const target = event.target.closest("button,[data-close-modal]");
    if (!target) return;
    if (target.matches("[data-close-modal]") || target.closest("[data-close-modal]")) { closeModal(); return; }
    if (target.dataset.route) { routeTo(target.dataset.route); return; }
    if (target.dataset.scrollFeed !== undefined) { document.querySelector("#learning-feed")?.scrollIntoView({ behavior: "smooth" }); return; }
    if (target.dataset.login !== undefined) { askForDemoLogin(); return; }
    if (target.dataset.confirmLogin !== undefined) { state.loggedIn = true; saveState(); closeModal(); showToast("已进入 Demo 访客身份，仅本地有效"); render(); return; }
    if (target.dataset.confirmLogout !== undefined) { state.loggedIn = false; saveState(); closeModal(); showToast("已退出 Demo 身份"); render(); return; }
    if (target.dataset.specialty) { state.specialty = target.dataset.specialty; saveState(); render(); return; }
    if (target.dataset.sort) { state.sort = target.dataset.sort; saveState(); render(); return; }
    if (target.dataset.clearSearch !== undefined) { state.query = ""; saveState(); render(); return; }
    if (target.dataset.resetFilters !== undefined) { state.query = ""; state.specialty = "全部专业"; state.sort = "latest"; saveState(); render(); return; }
    if (target.dataset.bookmark) { if (!requireLogin()) return; toggleArray("bookmarks", target.dataset.bookmark); showToast(state.bookmarks.includes(target.dataset.bookmark) ? "已收藏到本浏览器" : "已取消本地收藏"); render(); return; }
    if (target.dataset.like) { if (!requireLogin()) return; toggleArray("likes", target.dataset.like); showToast("有帮助状态已在本地更新"); render(); return; }
    if (target.dataset.helpful) { if (!requireLogin()) return; toggleArray("helpful", target.dataset.helpful); showToast("回答反馈已在本地更新"); render(); return; }
    if (target.dataset.answer) { if (!requireLogin()) return; openAnswerModal(target.dataset.answer); return; }
    if (target.dataset.demoShare !== undefined) { showToast("静态演示不调用系统分享；可直接复制当前网址"); return; }
    if (target.dataset.demoReport) { if (!requireLogin()) return; openReportModal(); return; }
    if (target.dataset.readNotification) { const index = Number(target.dataset.readNotification); if (!state.readNotifications.includes(index)) state.readNotifications.push(index); saveState(); render(); return; }
    if (target.dataset.readAll !== undefined) { state.readNotifications = DATA.notifications.map((_, index) => index); saveState(); showToast("模拟通知已全部标记为已读"); render(); return; }
    if (target.dataset.reportAction) { state.reportStatus[target.dataset.reportId] = target.dataset.reportAction === "resolve" ? "已处理" : "复核中"; saveState(); showToast("管理员演示状态已更新，不涉及真实内容"); render(); return; }
    if (target.dataset.resourceSave !== undefined) { if (!requireLogin()) return; showToast("资源收藏为演示状态；没有真实文件下载"); return; }
    if (target.dataset.joinActivity !== undefined) { if (!requireLogin()) return; toggleArray("joinedActivities", Number(target.dataset.joinActivity)); showToast("活动报名状态仅保存在本浏览器"); render(); return; }
    if (target.dataset.showBookmarks !== undefined) { showBookmarksModal(); return; }
    if (target.dataset.clearDemo !== undefined) { openClearModal(); return; }
    if (target.dataset.info !== undefined) { openInfoModal(Number(target.dataset.info)); }
  });

  document.addEventListener("input", (event) => {
    if (event.target.id === "question-search") {
      state.query = event.target.value;
      saveState();
      clearTimeout(searchRenderTimer);
      searchRenderTimer = setTimeout(() => {
        const route = currentRoute();
        if (route.page !== "search" && route.page !== "home") return;
        const cursor = state.query.length;
        render();
        const input = document.querySelector("#question-search");
        input?.focus();
        input?.setSelectionRange(cursor, cursor);
      }, 120);
    }
    if (event.target.form?.id === "ask-form") {
      const form = event.target.form;
      form.querySelector("[data-title-count]").textContent = form.elements.title.value.length;
      form.querySelector("[data-body-count]").textContent = form.elements.body.value.length;
      event.target.closest(".field")?.classList.remove("invalid");
    }
  });

  document.addEventListener("submit", (event) => {
    event.preventDefault();
    if (event.target.id === "ask-form") submitQuestion(event.target);
    if (event.target.id === "answer-form") submitAnswer(event.target);
  });

  function toggleArray(key, value) {
    const array = state[key];
    const index = array.indexOf(value);
    if (index >= 0) array.splice(index, 1); else array.push(value);
    saveState();
  }

  function submitQuestion(form) {
    if (!requireLogin("发布问题是本地 Demo 交互。")) return;
    const title = form.elements.title.value.trim();
    const body = form.elements.body.value.trim();
    const course = form.elements.course.value.trim();
    const validation = { title: title.length >= 8, body: body.length >= 30, course: course.length >= 2 };
    Object.entries(validation).forEach(([key, valid]) => form.querySelector(`[data-field="${key}"]`)?.classList.toggle("invalid", !valid));
    if (Object.values(validation).some((valid) => !valid)) { showToast("请完善标红的演示字段"); return; }
    const question = {
      id: `local-${Date.now()}`,
      specialty: form.elements.specialty.value,
      course,
      title,
      body,
      tags: [course, "本地发布"],
      author: "Demo 访客",
      time: "本地模拟 · 刚刚",
      age: -1,
      status: "waiting",
      views: 0,
      likes: 0,
      favorites: 0,
      answers: [],
    };
    state.localQuestions.unshift(question);
    saveState();
    showToast("发布成功：仅保存在当前浏览器 Demo");
    routeTo(`question/${question.id}`);
  }

  function openAnswerModal(questionId) {
    openModal(`<p class="eyebrow">LOCAL ANSWER DEMO</p><h2>写一条演示回答</h2><p>请写有实际信息的回答。提交后只保存在当前浏览器，不会发送到服务器。</p><form id="answer-form"><input type="hidden" name="questionId" value="${escapeHtml(questionId)}"/><label class="field"><textarea name="body" maxlength="600" minlength="30" placeholder="说明思路、适用条件和需要注意的边界……" required></textarea></label><div class="modal-actions"><button type="button" class="secondary-button" data-close-modal>取消</button><button class="primary-button" type="submit">提交本地回答</button></div></form>`);
  }

  function submitAnswer(form) {
    const body = form.elements.body.value.trim();
    if (body.length < 30) { showToast("演示回答至少需要 30 个字"); return; }
    const id = form.elements.questionId.value;
    state.localAnswers[id] ||= [];
    state.localAnswers[id].push({ author: "Demo 访客", time: "本地模拟 · 刚刚", helpful: 0, accepted: false, body });
    saveState();
    closeModal();
    showToast("回答已加入当前浏览器 Demo");
    render();
  }

  function openReportModal() {
    openModal(`<p class="eyebrow">REPORT DEMO</p><h2>模拟举报已记录在界面</h2><p>静态站不会上传举报，也不会创建真实治理记录。正式版应由服务器验证登录身份、目标存在性和管理员权限。</p><div class="modal-actions"><button class="primary-button" data-close-modal>我知道了</button></div>`);
  }

  function showBookmarksModal() {
    const questions = allQuestions().filter((item) => state.bookmarks.includes(item.id));
    openModal(`<p class="eyebrow">LOCAL BOOKMARKS</p><h2>我的本地收藏</h2>${questions.length ? `<p>${questions.map((item) => `• ${escapeHtml(item.title)}`).join("<br/>")}</p>` : "<p>还没有收藏。收藏状态只保存在当前浏览器。</p>"}<div class="modal-actions"><button class="primary-button" data-close-modal>关闭</button></div>`);
  }

  function openClearModal() {
    openModal(`<p class="eyebrow">RESET LOCAL DEMO</p><h2>清除所有本地演示状态？</h2><p>将移除收藏、点赞、本地发布问题与回答。预置的 30 条模拟内容不会改变。</p><div class="modal-actions"><button class="secondary-button" data-close-modal>取消</button><button class="primary-button" data-confirm-clear>确认清除</button></div>`);
  }

  function openInfoModal(index) {
    const details = [
      "这是面向材料学院学生的学习互助产品演示，核心目标是让具体问题得到回答，并让有效经验可检索、可沉淀。",
      "可使用专业筛选、关键词搜索和排序浏览 30 条模拟问题；收藏、点赞、发布与回答仅保存在浏览器。",
      "因为 GitHub Pages 只能托管静态文件，本 Demo 不连接账号、数据库、邮件、通知或权限服务。",
      "本 Demo 不要求填写个人信息，也不会发起网络请求；清除浏览器站点数据即可删除本地临时状态。",
      "演示社区规则仅体现学习相关、保护隐私、尊重交流和可举报的产品方向，并非正式发布文件。",
      "V002 Static Demo · 视觉与交互展示用途 · 数据全部虚构。",
    ];
    openModal(`<p class="eyebrow">MORE / ${String(index + 1).padStart(2,"0")}</p><h2>演示说明</h2><p>${escapeHtml(details[index] || details[5])}</p><div class="modal-actions"><button class="primary-button" data-close-modal>关闭</button></div>`);
  }

  document.addEventListener("click", (event) => {
    const clear = event.target.closest("[data-confirm-clear]");
    if (!clear) return;
    state = { ...defaultState };
    localStorage.removeItem(STORAGE_KEY);
    closeModal();
    showToast("本地演示状态已清除");
    render();
  });

  window.addEventListener("hashchange", render);
  if (!window.location.hash) window.location.hash = "#/home";
  else render();
})();
