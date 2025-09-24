const { adminDB } = require("../../config/firebase");
const { Timestamp } = require("firebase-admin/firestore");
const Resource = require("../models/Resource");
const { google } = require("googleapis");
const axios = require("axios");

const fetchMetaFromUrl = async (url) => {
  const got = (await import("got")).default; // import động
  const { body: html } = await got(url);
  const metascraper = require("metascraper")([
    require("metascraper-title")(),
    require("metascraper-description")(),
    require("metascraper-image")(),
    require("metascraper-publisher")(),
    require("metascraper-date")(),
  ]);
  return await metascraper({ html, url });
};

const resourcesCollection = adminDB.collection("resources");
const youtube = google.youtube("v3");

// === Helper: lấy videoId từ URL hoặc chuỗi ===
function extractVideoId(urlOrId) {
  try {
    const url = new URL(urlOrId);
    if (url.hostname.includes("youtube.com")) {
      return url.searchParams.get("v");
    } else if (url.hostname.includes("youtu.be")) {
      return url.pathname.slice(1);
    }
  } catch (err) {
    return urlOrId; // coi là videoId trực tiếp
  }
  return null;
}
// bỏ dòng require ở trên đi
// const { extract } = require('@extractus/article-extractor');

// Viết 1 helper riêng
const extractArticle = async (url) => {
  const { extract } = await import("@extractus/article-extractor");
  return extract(url);
};

// === Helper: gọi YouTube API lấy metadata ===
async function fetchYoutubeMeta(videoId) {
  const response = await youtube.videos.list({
    key: process.env.YOUTUBE_API_KEY,
    part: "snippet,contentDetails",
    id: videoId,
  });

  if (!response.data.items.length) throw new Error("YouTube video not found");

  const snippet = response.data.items[0].snippet;
  return {
    title: snippet.title,
    description: snippet.description,
    thumbnail: snippet.thumbnails?.high?.url,
    channelTitle: snippet.channelTitle,
    publishedAt: snippet.publishedAt,
    tags: snippet.tags || [],
  };
}

// === Helper: gọi Google Custom Search API lấy News ===
async function fetchGoogleNews(query, num = 5) {
  const API_KEY = process.env.GOOGLE_API_KEY;
  const CX = process.env.GOOGLE_CSE_ID;
  const url = `https://www.googleapis.com/customsearch/v1`;
  const params = { key: API_KEY, cx: CX, q: query, num };

  const res = await axios.get(url, { params });
  if (!res.data.items) return [];

  return res.data.items.map((item) => ({
    title: item.title,
    link: item.link,
    snippet: item.snippet,
    image: item.pagemap?.cse_image?.[0]?.src || null,
    publishedAt: item.pagemap?.metatags?.[0]["article:published_time"] || null,
  }));
}

const ResourceController = {
  // === GET ALL RESOURCES ===
  getAllResources: async (req, res) => {
    try {
      let { pageSize = 10, sort = "desc", startAfterId, type } = req.query;
      pageSize = parseInt(pageSize);

      let queryRef = resourcesCollection.where("isDisabled", "==", false);
      if (type) queryRef = queryRef.where("type", "==", type);

      queryRef = queryRef.orderBy("updatedAt", sort);

      if (startAfterId) {
        const startAfterDoc = await resourcesCollection.doc(startAfterId).get();
        if (startAfterDoc.exists) queryRef = queryRef.startAfter(startAfterDoc);
      }

      queryRef = queryRef.limit(pageSize);
      const snapshot = await queryRef.get();
      const resources = snapshot.docs.map((doc) => Resource.fromFirestore(doc));

      const snapshotCount = await resourcesCollection
        .where("isDisabled", "==", false)
        .get();
      const total = snapshotCount.size;

      res.status(200).json({
        pageSize,
        total,
        resources,
        sort: sort === "asc" ? "oldest" : "newest",
        nextCursor: resources.length
          ? resources[resources.length - 1].id
          : null,
      });
    } catch (err) {
      console.error("Get all resources error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // === GET RESOURCE BY ID ===
  getResourceById: async (req, res) => {
    try {
      const doc = await resourcesCollection.doc(req.params.id).get();
      if (!doc.exists)
        return res.status(404).json({ error: "Resource not found" });
      res.status(200).json(Resource.fromFirestore(doc));
    } catch (err) {
      console.error("Get resource by ID error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // === CREATE RESOURCE (YouTube + Web + Google News) ===
  createResource: async (req, res) => {
    try {
      const { title, description, type, url, query, categoryId } = req.body;
      if (!type) return res.status(400).json({ error: "Type is required" });

      let newResource = {
        type,
        categoryId,
        title: title || "",
        description: description || "",
        url: url || null,
        image: null,
        videoId: null,
        channelTitle: null,
        publishedAt: null,
        tags: [],
        isDisabled: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      // --- YouTube ---
      if (type === "youtube") {
        if (!url)
          return res.status(400).json({ error: "YouTube URL is required" });

        const videoId = extractVideoId(url);
        if (!videoId)
          return res.status(400).json({ error: "Invalid YouTube URL" });

        const meta = await fetchYoutubeMeta(videoId);

        // Lọc nội dung cấm
        const bannedKeywords = ["18+", "xxx", "violent"];
        if (
          bannedKeywords.some((kw) => meta.title.toLowerCase().includes(kw))
        ) {
          return res
            .status(400)
            .json({ error: "Video contains banned content" });
        }

        newResource = {
          ...newResource,
          type,
          categoryId,
          title: title || meta.title,
          description: description || meta.description,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          image: meta.thumbnail,
          videoId,
          channelTitle: meta.channelTitle,
          publishedAt: meta.publishedAt,
          tags: meta.tags,
        };
      }

      // --- Web link (news/article) ---
      // --- Web link (news/article) ---
      if (type === "news" && url) {
        const meta = await fetchMetaFromUrl(url);
        const article = await extractArticle(url); // lấy content chi tiết

        newResource = {
          ...newResource,
          title: title || meta.title || article.title,
          description: description || meta.description || article.description,
          url,
          image: meta.image || article.image || null,
          publishedAt: meta.date || article.published || null,
          content: article.content || null, // 🔥 nội dung chi tiết đầy đủ
        };
      }

      // --- Google News search ---
      if (type === "news" && query && !url) {
        const articles = await fetchGoogleNews(query, 1);
        if (!articles.length)
          return res.status(404).json({ error: "No articles found" });

        const article = articles[0];
        newResource = {
          ...newResource,
          title: article.title,
          description: article.snippet,
          url: article.link,
          image: article.image,
          publishedAt: article.publishedAt,
        };
      }

      const docRef = await resourcesCollection.add(newResource);
      const createdDoc = await docRef.get();

      return res.status(201).json({
        message:
          type === "youtube"
            ? "YouTube resource created"
            : "Web resource created",
        resource: Resource.fromFirestore(createdDoc),
      });
    } catch (err) {
      console.error("Create resource error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  updateResource: async (req, res) => {
    try {
      const { id } = req.params;
      let updates = { ...req.body, updatedAt: Timestamp.now() };

      const docRef = resourcesCollection.doc(id);
      const doc = await docRef.get();
      if (!doc.exists)
        return res.status(404).json({ error: "Resource not found" });

      const existing = doc.data();

      // Thêm video cho news mà không đè URL
      if (
        updates.url &&
        existing.type === "news" &&
        req.body.updateVideo === true
      ) {
        const videoId = extractVideoId(updates.url);
        if (videoId) {
          const meta = await fetchYoutubeMeta(videoId);

          updates.videoId = videoId;
          // updates.image = meta.thumbnail; // giữ ảnh cũ hoặc dùng thumbnail mới
          updates.channelTitle = meta.channelTitle;
          updates.publishedAt = meta.publishedAt;
          updates.tags = meta.tags;

          // giữ nguyên nội dung text
          updates.title = existing.title;
          updates.description = existing.description;
          updates.content = existing.content;

          // Nối URL mới vào URL gốc
          updates.url = existing.url
            ? existing.url + " + " + req.body.url
            : req.body.url;
        }
      }

      await docRef.update(updates);
      const updatedDoc = await docRef.get();

      res.status(200).json({
        message: "Resource updated",
        resource: Resource.fromFirestore(updatedDoc),
      });
    } catch (err) {
      console.error("Update resource error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // === TOGGLE RESOURCE STATUS ===
  toggleResourceStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { isDisabled } = req.body;
      if (typeof isDisabled !== "boolean")
        return res.status(400).json({ error: "isDisabled must be boolean" });

      const docRef = resourcesCollection.doc(id);
      const doc = await docRef.get();
      if (!doc.exists)
        return res.status(404).json({ error: "Resource not found" });

      await docRef.update({ isDisabled, updatedAt: Timestamp.now() });
      const updatedDoc = await docRef.get();

      res.status(200).json({
        message: isDisabled
          ? "Resource disabled successfully"
          : "Resource enabled successfully",
        resource: Resource.fromFirestore(updatedDoc),
      });
    } catch (err) {
      console.error("Toggle resource status error:", err);
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = ResourceController;
