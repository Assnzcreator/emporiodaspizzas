const url = "https://fluxiabr.uazapi.com";
const token = "fe1c08cb-a29d-4957-bbd0-af71d95bce42";
const phone = "5511999999999"; // Substitua por um número real seu para testar se quiser

async function testSend() {
  console.log("Tentando enviar para:", `${url}/send/text`);
  try {
    const response = await fetch(`${url}/send/text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "token": token
      },
      body: JSON.stringify({
        chatid: phone,
        text: "Teste da API Empório Eats"
      })
    });

    const result = await response.json();
    console.log("Resultado:", result);
  } catch (error) {
    console.error("Erro na requisição:", error);
  }
}

testSend();
