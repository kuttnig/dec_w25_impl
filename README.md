### Frontend Setup

```
cd frontend
```

```
docker compose up
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
