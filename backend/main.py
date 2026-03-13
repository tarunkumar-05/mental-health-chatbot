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
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

class Message(BaseModel):
    text: str

SYSTEM_PROMPT = """You are MindEase, a compassionate and empathetic mental health support chatbot.
Your role is to:
- Listen carefully and respond with empathy and understanding
- Provide emotional support and encouragement
- Suggest healthy coping strategies when appropriate
- Always be kind, non-judgmental, and supportive
- Keep responses concise but meaningful (2-4 sentences)
- If someone is in crisis, encourage them to seek professional help
- Never diagnose or prescribe medication
Remember: You are a supportive companion, not a replacement for professional mental health care."""

def simple_sentiment(text):
    text_lower = text.lower()
    positive_words = ["happy", "good", "great", "amazing", "wonderful", "excited", "joy", "love",
                      "better", "awesome", "fantastic", "blessed", "grateful", "calm", "peaceful",
                      "hopeful", "motivated", "proud", "confident", "relieved", "glad", "fine", "okay"]
    negative_words = ["sad", "depressed", "anxious", "stressed", "worried", "scared", "afraid",
                      "terrible", "awful", "bad", "hate", "angry", "frustrated", "hopele