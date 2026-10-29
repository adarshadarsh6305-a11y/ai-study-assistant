
export async function askAI(feature, prompt) {
  const response = await fetch("http://localhost:5000/api/ai", {
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

