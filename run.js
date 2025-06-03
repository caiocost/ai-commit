import openai from './openai.js'; // ajuste o caminho se for diferente

async function testCommit() {
    const diff = `
- Linha removida
+ Linha adicionada
  `;

    // Gera o prompt em português
    const prompt = openai.getPromptForSingleCommit(diff, { language: 'português' });

    // Filtra o prompt (sem pedir confirmação)
    const ok = await openai.filterApi({ prompt, numCompletion: 1, filterFee: false });
    if (!ok) {
        console.log('Execução cancelada pelo usuário.');
        return;
    }

    // Envia a mensagem para a OpenAI
    const message = await openai.sendMessage(prompt, { model: 'gpt-4o-mini' });

    console.log('Mensagem de commit gerada:');
    console.log(message);
}

testCommit();
