from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from dotenv import load_dotenv
import httpx
import os

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

class Message(BaseModel):
    text: str

SYSTEM_PROMPT = """You are a compassionate mental health support chatbot.
Your role is to listen empathetically, provide emotional support,
suggest healthy coping strategies, and always recommend professional
help for serious issues. Keep responses concise and warm."""

def simple_sentiment(text):
    negative_words = ["sad", "anxious", "stressed", "depressed", "lonely", "hopeless", "worried", "scared", "angry", "upset", "terrible", "awful", "horrible", "miserable"]
    positive_words = ["happy", "good", "great", "excited", "wonderful", "amazing", "fantastic", "joy", "blessed", "grateful", "love", "better", "hopeful"]
    text_lower = text.lower()
    neg_count = sum(1 for word in negative_words if word in text_lower)
    pos_count = sum(1 for word in positive_words if word in text_lower)
    if neg_count > pos_count:
        return "NEGATIVE", 85.0
    elif pos_count > neg_count:
        return "POSITIVE", 85.0
    else:
        return "NEUTRAL", 70.0

async def save_to_supabase(user_message, bot_response, sentiment, confidence):
    try:
        async with httpx.AsyncClient() as http:
            await http.post(
                f"{SUPABASE_URL}/rest/v1/chat_history",
                headers={
                    "apikey": SUPABASE_KEY,
                    "Authorization": f"Bearer {SUPABASE_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "user_message": user_message,
                    "bot_response": bot_response,
                    "sentiment": sentiment,
                    "confidence": confidence,
                }
            )
    except Exception as e:
        print(f"Supabase error: {e}")

@app.get("/")
def home():
    return {"status": "Mental Health Chatbot API is running!"}

@app.post("/chat")
async def chat(message: Message):
    sentiment, score = simple_sentiment(message.text)

    prompt = SYSTEM_PROMPT + "\nUser emotional state: " + sentiment + "\nUser message: " + message.text + "\nRespond with empathy."

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )

    await save_to_supabase(message.text, response.text, sentiment, score)

    return {
        "response": response.text,
        "sentiment": sentiment,
        "confidence": score
    }