const fs = require("fs");
const path = require("path");
const Koa = require("koa");
const Router = require("koa-router");
const Render = require("koa-ejs");
const bodyParser = require("koa-bodyparser");
const marked = require("marked");
const app = new Koa();
const router = new Router();
Render(app, {
  root: path.join(__dirname, "view"),
  layout: "layout",
  viewExt: "ejs"
});

let token = "minblog";

let posts = JSON.parse(fs.readFileSync("./posts.json").toString());

router.get("/", async ctx => {
  ctx.state.posts = posts;
  await ctx.render("list");
});
router.get("/posts/:postid", async ctx => {
  ctx.state.post = posts[ctx.params.postid];
  ctx.state.postid = ctx.params.postid;
  ctx.state.html = marked(ctx.state.post.content);
  await ctx.render("detail");
});
router.get("/login", async ctx => {
  await ctx.render("login");
});
router.post("/login", async ctx => {
  if (ctx.request.body.token == token) {
    ctx.cookies.set("token", token);
    ctx.redirect("/");
  }
  ctx.body = "密码不对";
});
router.get("/edit/:postid", async ctx => {
  ctx.state.post = posts[ctx.params.postid] || {};
  ctx.state.postid = ctx.params.postid;
  await ctx.render("edit");
});
router.post("/posts/:postid", async ctx => {
  if (!ctx.state.logined) {
    ctx.body = "未登录";
  }
  if (ctx.request.body.show !== "true") {
    delete ctx.request.body.show;
  }
  if (ctx.params.postid == "new") {
    posts.push(ctx.request.body);
    ctx.params.postid = posts.length - 1;
  } else {
    posts[ctx.params.postid] = ctx.request.body;
  }
  fs.writeFileSync("./posts.json", JSON.stringify(posts, null, 2));
  ctx.redirect("/posts/" + ctx.params.postid);
});

app.use(async (ctx, next) => {
  ctx.state.logined = false;
  if (ctx.cookies.get("token") == token) {
    ctx.state.logined = true;
  }
  await next();
});
app.use(bodyParser());
app.use(router.routes()).use(router.allowedMethods());

app.listen(3000);
