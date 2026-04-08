from fastapi import APIRouter

from app.api.v1.endpoints import analyze, auth, game, user

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(user.router, prefix="/users", tags=["users"])
api_router.include_router(game.router, prefix="/games", tags=["games"])
api_router.include_router(analyze.router, tags=["analyze"])
