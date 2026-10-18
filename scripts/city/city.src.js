/* Blog city: loads the street model, gives each post a building and flies the camera to it.
   Exposes window.BlogCity.create(options). Built with `npm run build` in scripts/city. */
import {
  WebGLRenderer, Scene, PerspectiveCamera, Color, Fog, HemisphereLight, DirectionalLight,
  Box3, Vector3, Raycaster, Vector2, SRGBColorSpace, MathUtils
} from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

var DIRS = [new Vector3(1, 0, 0), new Vector3(-1, 0, 0), new Vector3(0, 0, 1), new Vector3(0, 0, -1)];
var ease = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

function create(opt) {
  var host = opt.el, FOV = 38;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.className = 'city-canvas';
  host.appendChild(renderer.domElement);

  var scene = new Scene();
  scene.fog = new Fog(0x04060c, 1400, 3800);
  var camera = new PerspectiveCamera(FOV, 1, 4, 9000);
  scene.add(new HemisphereLight(0x9db6e6, 0x151922, 1.15));
  var moon = new DirectionalLight(0xcfdcff, 1.35); moon.position.set(-900, 1400, 700); scene.add(moon);

  var buildings = [], slugMap = {}, all = [], city = null;
  var view = { pos: new Vector3(), look: new Vector3() };
  var overview = { center: new Vector3(-150, 160, -450), radius: 1550, height: 720, angle: 0.55 };
  var fly = null, focused = null, hovered = null, visible = true, running = false, destroyed = false, last = 0;
  var api = { ready: null, onPick: null, onHover: null, onFocus: null };

  function resize() {
    var w = host.clientWidth || 1, h = host.clientHeight || 1;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    if (focused && !fly) api.onFocus && api.onFocus(focused.slug, rectFor(focused));
  }

  function overviewPose(angle) {
    return {
      pos: new Vector3(overview.center.x + Math.sin(angle) * overview.radius, overview.height,
                       overview.center.z + Math.cos(angle) * overview.radius),
      look: overview.center.clone()
    };
  }

  /* Pick the open side of a building, and a camera spot that frames that side. */
  function facade(b) {
    var box = b.box, c = box.getCenter(new Vector3()), s = box.getSize(new Vector3());
    var ray = new Raycaster(), best = null;
    DIRS.forEach(function (d) {
      var half = (Math.abs(d.x) ? s.x : s.z) / 2;
      var o = c.clone(); o.y = box.min.y + s.y * 0.45; o.addScaledVector(d, half + 1);
      ray.set(o, d); ray.far = 900;
      var hit = ray.intersectObjects(all, false).filter(function (h) { return h.object !== b.mesh; })[0];
      var free = hit ? hit.distance : 900;
      if (!best || free > best.free + 1) best = { dir: d, free: free, half: half };
    });
    var W = Math.abs(best.dir.x) ? s.z : s.x, H = s.y;
    var t = Math.tan(MathUtils.degToRad(FOV / 2));
    return { dir: best.dir, free: best.free, half: best.half, W: W, H: H, c: c, s: s, t: t };
  }

  function poseFor(b) {
    var f = b.f, aspect = camera.aspect;
    var d = Math.max(f.H * 1.05 / (2 * f.t), f.W * 1.1 / (2 * f.t * aspect));
    d = Math.min(d, f.free * 0.92 + 40);
    var face = f.c.clone().addScaledVector(f.dir, f.half);
    var look = new Vector3(face.x, f.s.y * 0.52 + b.box.min.y, face.z);
    return { pos: look.clone().addScaledVector(f.dir, d), look: look };
  }

  /* Screen rectangle (in host pixels) covered by the building's open side. */
  function rectFor(b) {
    var f = b.f, face = f.c.clone().addScaledVector(f.dir, f.half);
    var side = Math.abs(f.dir.x) ? new Vector3(0, 0, 1) : new Vector3(1, 0, 0);
    var w = host.clientWidth, h = host.clientHeight, x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    camera.updateMatrixWorld();
    [[-1, 0], [1, 0], [-1, 1], [1, 1]].forEach(function (k) {
      var p = face.clone().addScaledVector(side, k[0] * f.W / 2); p.y = b.box.min.y + k[1] * f.H;
      p.project(camera);
      var x = (p.x * 0.5 + 0.5) * w, y = (-p.y * 0.5 + 0.5) * h;
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    });
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0, stageW: w, stageH: h };
  }

  function flyTo(pose, done, ms) {
    if (reduce) { view.pos.copy(pose.pos); view.look.copy(pose.look); fly = null; apply(); done && done(); return; }
    fly = { t0: performance.now(), ms: ms || 1700, p0: view.pos.clone(), l0: view.look.clone(), p1: pose.pos.clone(), l1: pose.look.clone(), done: done };
    start();
  }

  function apply() { camera.position.copy(view.pos); camera.lookAt(view.look); }

  function tick(now) {
    if (destroyed) return;
    var finished = null;
    var dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    if (fly) {
      var k = Math.min(1, (now - fly.t0) / fly.ms), e = ease(k);
      view.pos.lerpVectors(fly.p0, fly.p1, e);
      view.look.lerpVectors(fly.l0, fly.l1, e);
      view.pos.y += Math.sin(Math.PI * e) * 60;            // small arc so the move reads as a flight
      if (k >= 1) { finished = fly.done || true; fly = null; }
    } else if (!focused && !reduce) {
      overview.angle += dt * 0.035;
      var p = overviewPose(overview.angle); view.pos.copy(p.pos); view.look.copy(p.look);
    }
    apply();
    renderer.render(scene, camera);
    if (typeof finished === 'function') finished();
    if (visible && (fly || !focused || hovered)) requestAnimationFrame(tick); else running = false;
  }
  function start() { if (!running && !destroyed) { running = true; last = performance.now(); requestAnimationFrame(tick); } }

  /* Public: bind posts to buildings in order and light their windows. */
  api.assign = function (slugs) {
    slugMap = {};
    buildings.forEach(function (b) { b.slug = null; setGlow(b, 0); });
    slugs.forEach(function (s, i) {
      var b = buildings[i]; if (!b) return;
      b.slug = s; slugMap[s] = b; setGlow(b, 0.32);
    });
  };
  api.has = function (slug) { return !!slugMap[slug]; };
  api.focus = function (slug, done) {
    var b = slugMap[slug]; if (!b) return false;
    focused = b; setHover(null);
    host.classList.add('is-focused');
    flyTo(poseFor(b), function () { api.onFocus && api.onFocus(slug, rectFor(b)); done && done(); });
    return true;
  };
  api.back = function (done) {
    focused = null; host.classList.remove('is-focused');
    var p = overviewPose(overview.angle);
    flyTo({ pos: p.pos, look: p.look }, done);
  };
  api.order = function () { return buildings.map(function (b) { return b.name; }); };

  function setGlow(b, v) {
    b.glow = v;
    b.mats.forEach(function (m) { if (m.emissive) { m.emissive.setRGB(0.55 * v, 0.68 * v, 1.0 * v); } });
  }
  function setHover(b) {
    if (hovered === b) return;
    if (hovered && hovered !== focused) setGlow(hovered, 0.32);
    hovered = b;
    if (b) setGlow(b, 0.7);
    host.style.cursor = b ? 'pointer' : '';
    api.onHover && api.onHover(b ? b.slug : null);
    start();
  }

  var ray = new Raycaster(), mouse = new Vector2();
  function pick(ev) {
    var r = renderer.domElement.getBoundingClientRect();
    mouse.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(mouse, camera);
    var hit = ray.intersectObjects(buildings.map(function (b) { return b.mesh; }), false)[0];
    if (!hit) return null;
    for (var i = 0; i < buildings.length; i++) if (buildings[i].mesh === hit.object) return buildings[i];
    return null;
  }
  renderer.domElement.addEventListener('pointermove', function (ev) {
    if (focused || fly || ev.pointerType === 'touch') return;
    var b = pick(ev); setHover(b && b.slug ? b : null);
  });
  renderer.domElement.addEventListener('pointerleave', function () { setHover(null); });
  renderer.domElement.addEventListener('click', function (ev) {
    var b = pick(ev);
    if (b && b.slug) api.onPick && api.onPick(b.slug);
    else if (focused) api.onPick && api.onPick(null);
  });

  window.addEventListener('resize', resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(host);
  if (window.IntersectionObserver) new IntersectionObserver(function (e) {
    visible = e[0].isIntersecting; if (visible) start();
  }).observe(host);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) start(); });

  api.ready = new Promise(function (ok, no) {
    new FBXLoader().load(opt.model, function (obj) {
      city = obj; scene.add(obj); obj.updateMatrixWorld(true);
      obj.traverse(function (o) {
        if (!o.isMesh) return;
        all.push(o);
        [].concat(o.material).forEach(function (m) {
          if (m.map) m.map.colorSpace = SRGBColorSpace;
          if (m.specular) m.specular.setScalar(0.04);
          m.shininess = 8;
        });
        if (/^Cube/.test(o.name)) {
          o.material = [].concat(o.material).map(function (m) { return m.clone(); });
          if (o.material.length === 1) o.material = o.material[0];
          var mats = [].concat(o.material);
          buildings.push({ mesh: o, name: o.name, mats: mats, box: new Box3().setFromObject(o), slug: null, glow: 0 });
        }
      });
      resize();
      buildings.forEach(function (b) { b.f = facade(b); });
      var p0 = overviewPose(overview.angle); view.pos.copy(p0.pos); view.look.copy(p0.look);
      /* nearest buildings first, so the newest posts sit closest to the opening view */
      buildings.sort(function (a, b) { return a.box.getCenter(new Vector3()).distanceTo(p0.look) - b.box.getCenter(new Vector3()).distanceTo(p0.look); });
      apply(); start(); ok(api);
    }, undefined, function (e) { no(e); });
  });
  api.destroy = function () { destroyed = true; renderer.dispose(); };
  return api;
}

window.BlogCity = { create: create };
