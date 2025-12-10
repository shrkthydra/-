import express from "express";
import fetch from "node-fetch";

const app = express();

const FB_TOKEN = process.env.EAANZAsbwIdy8BQHDECKKWRBIQ5U7OFXHN5VrH6Vy90Cd6HiwiRQHUee2uhGQwY2RRL9ovGySKSmjaAqBjlyDTYtWKl5DoANJQWS1Aufi75954jsY3jf3ARP2ylRXxMeCxJUlT5doe7aZAfim4O4uhIZB9D9ZAiaCRAZBFk97hVPoXZCkeDAL7ZCEGiDnuDq0rlzDpEC35NHZCExe3G4lswbhUVmD4G1ouNjSaTbdLqdAXSoZA9EbmAarx4F1Ao19zrkBgd94durYdkrMNmo1ITNWi2nvz;
const PAGE_ID = process.env.61575914377149;
const TG_TOKEN = process.env.8463602212:AAGTZ5uDdDokHq5nLKpkjHydbliM7Kvx5Ys;
const CHAT_ID = process.env.574349213;
const LAST_POST = process.env.LAST_POST || "0";
const RAILWAY_TOKEN = process.env.9f556148-bf06-4d7e-a738-05709396d7c2;
const RAILWAY_SERVICE_ID = process.env.70c0d3f3-58fd-47bc-b530-4a29063b3c11;

async function getFacebookPost() {
  const url =
    `https://graph.facebook.com/${PAGE_ID}/posts?fields=` +
    `id,message,created_time,permalink_url,full_picture,attachments{media_type,media,url}` +
    `&access_token=${FB_TOKEN}`;

  const res = await fetch(url);
  const data = await res.json();
  return data.data ? data.data[0] : null;
}

async function sendMessage(text) {
  await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: false
    })
  });
}

async function sendPhoto(photo, caption) {
  await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendPhoto`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      photo,
      caption,
      parse_mode: "HTML"
    })
  });
}

async function sendVideo(video, caption) {
  await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendVideo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      video,
      caption,
      parse_mode: "HTML"
    })
  });
}

function formatDate(date) {
  return new Date(date).toLocaleString("ar-IQ", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

async function updateLastPost(id) {
  await fetch(`https://backboard.railway.app/v2/variables`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${RAILWAY_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      updates: [
        {
          serviceId: RAILWAY_SERVICE_ID,
          name: "LAST_POST",
          value: id
        }
      ]
    })
  });
}

app.get("/webhook", async (req, res) => {
  const post = await getFacebookPost();
  if (!post) return res.send("NO POST");

  if (post.id === LAST_POST) return res.send("NO NEW");

  const date = formatDate(post.created_time);
  const caption =
    `<b>🟦 خبر عاجل</b>\n\n${post.message || ""}\n\n🕓 ${date}\n🔗 ${post.permalink_url}`;

  if (post.attachments && post.attachments.data.length > 0) {
    const att = post.attachments.data[0];

    if (att.media_type === "video" && att.media && att.media.source) {
      await sendVideo(att.media.source, caption);
    } else if (att.media_type === "photo" && att.media && att.media.image.src) {
      await sendPhoto(att.media.image.src, caption);
    } else {
      await sendMessage(caption);
    }
  } else if (post.full_picture) {
    await sendPhoto(post.full_picture, caption);
  } else {
    await sendMessage(caption);
  }

  await updateLastPost(post.id);

  res.send("SENT");
});

app.listen(3000);
