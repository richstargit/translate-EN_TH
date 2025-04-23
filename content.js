let isDragging = false;
let startX, startY;
let selectionBox;
let blocker;
let dataUrl
chrome.runtime.onMessage.addListener((event) => {
    if(event.text=="Start"){
        document.addEventListener('mousedown',ondown,{ once: true });
        document.addEventListener('mousemove',onmove);
        document.addEventListener('mouseup', onup,{ once: true });
        dataUrl = event.dataUrl
    }
    if (event.event === "imageCaptured") {
      // Convert DataURL → Image object
      const img = new Image();
      img.onload = () => {
        // สร้าง canvas เท่ากับขนาดที่ crop
        const canvas = document.createElement("canvas");
        canvas.width = event.width;
        canvas.height = event.height;
    
        const ctx = canvas.getContext("2d");
    
        // วาดรูปจากตำแหน่งที่เลือก
        ctx.drawImage(
          img,
          event.startX, event.startY,         // ต้นทาง (ในภาพ)
          event.width, event.height,          // ขนาด crop
          0, 0,                               // ปลายทางใน canvas
          event.width, event.height
        );
    
        // แปลง canvas → Blob
        canvas.toBlob(blob => {
          const formData = new FormData();
          formData.append("image", blob, "cropped.png");
    
          fetch("https://cac7-2405-9800-b661-759b-7d8b-2be4-94df-d84b.ngrok-free.app/upload", {
            method: "POST",
            body: formData
          })
          .then(res => res.json())
          .then(data => {
            console.log(data);
            chrome.runtime.sendMessage({ event: "settext", text: data.message });
          })
          .catch(err => {
            console.error("❌ อัปโหลดไม่สำเร็จ:", err);
          });
        }, "image/png");
      };
    
      img.src = dataUrl;
    }    
});

function ondown(e){
    if (e.button !== 0) return; // แค่คลิกซ้ายเท่านั้น
    e.preventDefault();
    isDragging = true;
    startX = e.pageX;
    startY = e.pageY;
  
    // ปิดการเลือกข้อความ
    document.body.style.userSelect = 'none';
  
    // ถ้ามีกรอบอยู่แล้ว ให้ลบทิ้ง
    const sel = document.getElementById("SELECTIONBOX");
    if (sel) {
      document.body.removeChild(sel);
    }
  
    // สร้างกรอบใหม่
    selectionBox = document.createElement('div');
    selectionBox.id = "SELECTIONBOX";
    selectionBox.style.position = 'absolute';
    selectionBox.style.border = '1px dashed rgb(95, 95, 95)';
    selectionBox.style.pointerEvents = 'none';
    selectionBox.style.padding="2px"
    document.body.appendChild(selectionBox);
    // สร้าง overlay blocker
    blocker = document.createElement('div');
    blocker.id = 'BLOCKER';
    blocker.style.position = 'fixed';
    blocker.style.top = 0;
    blocker.style.left = 0;
    blocker.style.width = '100vw';
    blocker.style.height = '100vh';
    blocker.style.zIndex = 9998;
    blocker.style.cursor = 'crosshair';
    blocker.style.background = 'rgba(0,0,0,0)'; // โปร่งใส
    blocker.style.userSelect = 'none';
    blocker.style.pointerEvents = 'auto';
    document.body.appendChild(blocker);

  }

function onmove(e){
    if (isDragging) {
      e.preventDefault();
      const width = e.pageX - startX;
      const height = e.pageY - startY;
  
      selectionBox.style.left = `${Math.min(startX, e.pageX)-2}px`;
      selectionBox.style.top = `${Math.min(startY, e.pageY)-2}px`;
      selectionBox.style.width = `${Math.abs(width)}px`;
      selectionBox.style.height = `${Math.abs(height)}px`;
    }
  }

 function onup(e){
    if (isDragging) {
      isDragging = false;
      // เปิดการเลือกข้อความกลับคืน
      document.body.style.userSelect = '';
      if (selectionBox) {
        document.body.removeChild(selectionBox);
      }
      if (blocker) {
        document.body.removeChild(blocker);
        blocker = null;
      }
      
      // ส่งตำแหน่งที่เลือกไปยัง background
      chrome.runtime.sendMessage({
        event: "captureSelection",
        dataUrl:dataUrl,
        startX: Math.min(startX, e.pageX)-window.scrollX,
        startY: Math.min(startY, e.pageY)-window.scrollY,
        width: Math.abs(e.pageX - startX),
        height: Math.abs(e.pageY - startY)
      });
      console.log(Math.min(startX, e.pageX),Math.min(startY, e.pageY),Math.abs(e.pageX - startX),Math.abs(e.pageY - startY))
      //chrome.runtime.sendMessage({text: "save",textarea:textarea.value });
      // ลบกรอบ
      document.removeEventListener('mousemove',onmove)
    }
  }

  function dataURLtoBlob(dataURL) {
    const parts = dataURL.split(';base64,');
    const byteString = atob(parts[1]);
    const mimeString = parts[0].split(':')[1];
    
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
  
    return new Blob([ab], { type: mimeString });
  }
