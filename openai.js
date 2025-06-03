import { ChatGPTAPI } from "chatgpt";

import { encode } from 'gpt-3-encoder';
import inquirer from "inquirer";
import { AI_PROVIDER } from "./config.js"

const FEE_PER_1K_TOKENS = 0.02;
const MAX_TOKENS = 128000;
//this is the approximate cost of a completion (answer) fee from CHATGPT
const FEE_COMPLETION = 0.001;

const apiKey = process.env.OPENAI_API_KEY

const openai = {
  sendMessage: async (input, { apiKey: keyFromParam, model }) => {
    console.log("prompting chat gpt...");
    console.log("prompt: ", input);

    const api = new ChatGPTAPI({
      apiKey: keyFromParam || apiKey,  // usa parâmetro ou variável de ambiente
      completionParams: {
        model: model || "gpt-4o-mini",
      },
    });

    const { text } = await api.sendMessage(input);

    return text;
  },

  getPromptForSingleCommit: (diff, { commitType, customMessageConvention, language }) => {

    return (
      `Escreva uma mensagem de commit git profissional, clara e objetiva, em ${language}, baseada nas alterações abaixo.` +
      (commitType ? ` Use o tipo de commit '${commitType}'. ` : ". ") +
      `${customMessageConvention ? `Siga as seguintes regras em formato JSON, usando a chave para o que deve ser alterado e o valor para como deve ser alterado: ${customMessageConvention}.` : ''}` +
      " Não comece a mensagem com nada extra, use o tempo presente, escreva a frase completa incluindo o tipo de commit." +
      `${customMessageConvention ? ` Além disso, aplique essas regras JSON mesmo que conflitem com as anteriores: ${customMessageConvention}.` : '.'}` +
      '\n\n' +
      diff
    );
  },

  getPromptForMultipleCommits: (diff, { commitType, customMessageConvention, numOptions, language }) => {
    const prompt =
      `Escreva mensagens de commit git profissionais, claras e objetivas, em ${language}, baseadas nas alterações abaixo.` +
      (commitType ? ` Use o tipo de commit '${commitType}'. ` : ". ") +
      `Forneça ${numOptions} opções separadas por ponto e vírgula ";". ` +
      "Para cada opção, use o tempo presente, escreva a frase completa incluindo o tipo de commit." +
      `${customMessageConvention ? ` Além disso, aplique as seguintes regras em formato JSON, mesmo que entrem em conflito com as anteriores: ${customMessageConvention}.` : '.'}` +
      '\n\n' +
      diff;

    return prompt;
  },

  filterApi: async ({ prompt, numCompletion = 1, filterFee }) => {
    const numTokens = encode(prompt).length;
    const fee = numTokens / 1000 * FEE_PER_1K_TOKENS + (FEE_COMPLETION * numCompletion);

    if (numTokens > MAX_TOKENS) {
      console.log("O diff do commit é muito grande para a API do ChatGPT. Máximo de 4k tokens ou ~8k caracteres.");
      return false;
    }

    if (filterFee) {
      console.log(`Isso custará cerca de R$${+fee.toFixed(3)} para usar a API.`);
      const answer = await inquirer.prompt([
        {
          type: "confirm",
          name: "continue",
          message: "Deseja continuar 💸?",
          default: true,
        },
      ]);
      if (!answer.continue) return false;
    }

    return true;
  }
};

export default openai;
