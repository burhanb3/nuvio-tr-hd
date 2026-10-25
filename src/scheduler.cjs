'use strict';

// Nuvio clearTimeout removes a JS callback but does not cancel __plugin_sleep.
// quickjs-kt drains native async jobs before evaluate() returns. Never leave a
// 30-second native sleep behind after an otherwise completed plugin call.
function createScheduler({ setTimer = setTimeout, clearTimer = clearTimeout, tickMs = 100 } = {}) {
  const tasks = new Map();
  let next = 0, timer, closed = false;
  function arm() {
    if (closed || timer !== undefined || !tasks.size) return;
    const due = Math.min(...[...tasks.values()].map(task => task.due));
    timer = setTimer(() => {
      timer = undefined;
      const now = Date.now();
      for (const [id, task] of tasks) if (task.due <= now) {
        tasks.delete(id);
        task.callback();
      }
      arm();
    }, Math.max(1, Math.min(tickMs, due - Date.now())));
  }
  return {
    schedule(callback, delay) {
      if (closed) return null;
      const id = ++next;
      tasks.set(id, { callback, due: Date.now() + Math.max(1, delay) });
      arm();
      return id;
    },
    cancel(id) { tasks.delete(id); },
    close() {
      closed = true;
      tasks.clear();
      if (timer !== undefined) clearTimer(timer);
      timer = undefined;
    }
  };
}
module.exports = { createScheduler };
