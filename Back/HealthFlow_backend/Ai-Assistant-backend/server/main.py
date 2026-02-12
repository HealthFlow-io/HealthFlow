
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# include routes from docs
from docs.routes import router as docs_router
from chat.routes import router as chat_router


app = FastAPI()

# CORS - allow frontend to communicate with the AI backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# register routers
app.include_router(docs_router)
app.include_router(chat_router, prefix="/chat", tags=["chat"])


@app.get("/health")
def health_check():
    return {"status": "ok"}


def main():
    print("Hello from server!")


if __name__ == "__main__":
    main()
