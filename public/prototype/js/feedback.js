// feedback.js: Player feedback form (saved in localStorage)
// ---------------------------------------------------------
function getFbList() { try { return JSON.parse(localStorage.getItem(FB_KEY) || "[]"); } catch (e) { return []; } }
function openFeedback() { fbDraft = { stars: 0, stage: "", issues: [] }; el("fbNote").value = ""; renderFeedback(); el("feedbackModal").classList.remove("hidden"); }
function closeFeedback() { el("feedbackModal").classList.add("hidden"); }
function renderFeedback() {
    var sh = ""; for (var s = 1; s <= 5; s++)sh += "<button class='fb-star" + (s <= fbDraft.stars ? " on" : "") + "' onclick='setFbStar(" + s + ")'>★</button>"; el("fbStars").innerHTML = sh;
    var stList = ["1 Know CPU", "2 CPU in Motion", "3 Speaking CPU", "4 Memory", "5 Beyond CPU"];
    el("fbStages").innerHTML = stList.map(function (st) { return "<button class='fb-chip" + (fbDraft.stage === st ? " on" : "") + "' onclick=\"toggleFbStage('" + st + "')\">" + st + "</button>"; }).join("");
    var issList = ["Too fast / timed", "Too hard", "Too easy", "ChipBot hint unclear", "Bug or glitch"];
    el("fbIssues").innerHTML = issList.map(function (it) { return "<button class='fb-chip" + (fbDraft.issues.indexOf(it) !== -1 ? " on" : "") + "' onclick=\"toggleFbIssue('" + it + "')\">" + it + "</button>"; }).join("");
    el("fbCount").textContent = getFbList().length;
}
function setFbStar(n) { fbDraft.stars = n; renderFeedback(); }
function toggleFbStage(st) { fbDraft.stage = (fbDraft.stage === st) ? "" : st; renderFeedback(); }
function toggleFbIssue(it) { var idx = fbDraft.issues.indexOf(it); if (idx === -1) fbDraft.issues.push(it); else fbDraft.issues.splice(idx, 1); renderFeedback(); }
function submitFeedback() {
    var list = getFbList(); list.push({ ts: new Date().toISOString(), rating: fbDraft.stars, favoriteStage: fbDraft.stage, issues: fbDraft.issues, note: el("fbNote").value.trim(), objStats: game.objStats, arch: game.archChoices });
    try { localStorage.setItem(FB_KEY, JSON.stringify(list)); } catch (e) { }
    closeFeedback(); toast("🙏 Thank you! Feedback saved locally (" + list.length + " total)."); BOT.say("Thanks for completing Overclocked and sharing your feedback!", "party", "good");
}
function copyFeedbackLog() {
    var list = getFbList(); if (list.length === 0) { toast("No feedback submitted yet!"); return; }
    var txt = JSON.stringify(list, null, 2);
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(function () { toast("📋 Copied " + list.length + " feedback entries!"); });
    else toast("Saved in localStorage (" + FB_KEY + ")");
}
