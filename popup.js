document.getElementById("captureBtn").onclick = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      textarea.value = "Crop the screen."
      chrome.tabs.captureVisibleTab(null, { format: 'png' }, function(dataUrl) {
        if (chrome.runtime.lastError) {
          console.error('Capture failed:', chrome.runtime.lastError.message);
          return;
        }
        chrome.tabs.sendMessage(tabs[0].id, { text: "Start",dataUrl:dataUrl });
      });
    });
  };

  document.getElementById("tranBtn").onclick = () => {
    const formData = new FormData();
    formData.append("text", textarea.value);

    fetch("https://b62d-2405-9800-b661-759b-7d8b-2be4-94df-d84b.ngrok-free.app/translate", {
      method: "POST",
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        console.log(data);
        result.innerText=data.translated
      })
      .catch(err => {
        console.error("❌ อัปโหลดไม่สำเร็จ:", err);
      });
  };

const textarea = document.getElementById("inputtext")
const result = document.getElementById("result")
chrome.runtime.sendMessage({
    event: "open"
  }, (response) => {
    textarea.value = response.text;
  });

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.event === "settext") {
      textarea.value = message.text
    }
    if (message.event === "imageCaptured") {
      textarea.value = "Wait..."
    }
});
  