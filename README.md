### Frontend Setup

```
cd frontend
```

```
docker build -t dec_frontend .
```

```
docker run -p 5173:5173 dec_frontend
```

### Backend Setup

```
cd backend
```

```
docker build -t dec_backend .
```

```
docker run -v $(pwd)/src:/app/src -p 5172:5172 dec_backend
```
