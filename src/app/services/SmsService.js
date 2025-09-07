const https = require("https");

exports.smsService = (phones, content, type, sender) => {
  return new Promise((resolve, reject) => {
    const url = "api.speedsms.vn";
    const params = JSON.stringify({
      to: phones,
      content: content,
      sms_type: type,
      sender: sender,
    });

    const buf = Buffer.from(process.env.ACCESS_TOKEN + ":x");
    const auth = "Basic " + buf.toString("base64");

    const options = {
      hostname: url,
      port: 443,
      path: "/index.php/sms/send",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: auth,
      },
    };

    const req = https.request(options, (res) => {
      res.setEncoding("utf8");
      let body = "";

      res.on("data", (chunk) => {
        body += chunk;
      });

      res.on("end", () => {
        try {
          const json = JSON.parse(body);
          if (json.status === "success") {
            resolve(json);
          } else {
            reject(new Error("SMS failed: " + body));
          }
        } catch (err) {
          reject(new Error("Invalid response from SMS API: " + body));
        }
      });
    });

    req.on("error", (e) => {
      reject(new Error("SMS request error: " + e.message));
    });

    req.write(params);
    req.end();
  });
};
