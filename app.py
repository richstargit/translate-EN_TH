from fastapi import FastAPI,  File, UploadFile, Form
from fastapi.responses import JSONResponse
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
import easyocr
from io import BytesIO
from PIL import Image
import numpy as np
import os
from deep_translator import GoogleTranslator

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # อนุญาตให้ร้องขอจากทุกโดเมน
    allow_credentials=True,
    allow_methods=["*"],  # อนุญาตให้ใช้ทุก HTTP method (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # อนุญาตให้ใช้ทุก HTTP header
)

@app.post("/upload")
async def upload_image(image: UploadFile = File(...)):
    # รับไฟล์ภาพจาก FormData
    try:
        image_data = await image.read()

        # แปลง Bytes -> Image -> Numpy array
        image_pil = Image.open(BytesIO(image_data)).convert("RGB")
        image_np = np.array(image_pil)
        save_dir = "uploaded_images"
        os.makedirs(save_dir, exist_ok=True)
        filename = f"capture.png"
        save_path = os.path.join(save_dir, filename)

        # บันทึกภาพ
        image_pil.save(save_path)
        # OCR
        reader = easyocr.Reader(['en'])
        result = reader.readtext(image_np)
        text = ""
        for res in result:
            text+=res[1]+" "
        print(text)
        return JSONResponse(content={"message": text}, status_code=200)
    
    except Exception as e:
        return JSONResponse(content={"message": "Upload failed", "error": str(e)}, status_code=500)

@app.post("/translate")
async def translate_text(text: str = Form(...)):
    try:
        translated = GoogleTranslator(source='auto', target='th').translate(text)
        print(translated)
        return JSONResponse(content={"translated": translated}, status_code=200)
    except Exception as e:
        return JSONResponse(content={"message": "Translation failed", "error": str(e)}, status_code=500)
    
# @app.post("/crop")
# async def crop_image(
#     image: UploadFile = File(...),
#     x: int = Form(...),
#     y: int = Form(...),
#     width: int = Form(...),
#     height: int = Form(...)
# ):
#     try:
#         # Load image
#         image_data = await image.read()
#         img = Image.open(BytesIO(image_data)).convert("RGB")
#         img.save("original.png")
#         # Crop
#         print(img.size)
#         cropped = img.crop((x, y, x + width, y + height))

#         # Save cropped image (optional)
#         cropped.save("cropped.png")
#         print(x,y,width,height)
#         return JSONResponse(content={"message": "Cropped successfully"}, status_code=200)
#     except Exception as e:
#         return JSONResponse(content={"message": "Failed to crop", "error": str(e)}, status_code=500)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
