
export async function askAI(feature, prompt) {
 const response = await fetch("https://ai-study-assistant-fj2f.onrender.com/api/ai", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ feature, prompt }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Something went wrong.");
  }

  return data.answer;
}

