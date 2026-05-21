# Ollama + React 샘플

로컬 Ollama 서버에 요청을 보내는 React(Vite + TypeScript) 예제입니다.

## 1) Ollama 실행

예시:

```bash
ollama serve
ollama pull llama3.2
```

## 2) 프로젝트 실행

```bash
npm install
npm run dev
```

브라우저에서 표시된 주소(보통 http://localhost:5173)로 접속하면 채팅 샘플 화면이 나옵니다.

## 3) 동작 방식

- 프론트엔드 요청: `/api/ollama/api/chat`
- Vite 프록시: `http://127.0.0.1:11434`로 전달
- Ollama 호출 옵션: `stream: false`

필요하면 모델명을 입력창에서 바꿔 테스트할 수 있습니다.
