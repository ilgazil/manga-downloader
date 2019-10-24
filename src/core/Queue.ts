// @todo Use Promise.all

interface QueueProcessor {
  (input: any): Promise<any>
}

function process(inputs: any[], outputs: any[], processor: QueueProcessor) {
  if (!inputs.length) {
    // @ts-ignore
    return Promise.resolve(outputs);
  }

  const input = inputs.shift();

  return processor(input)
    .then((output) => {
      outputs.push(output);
      return process(inputs, outputs, processor)
    })
    .catch((error) => {
      console.log(error);
      return process(inputs, outputs, processor)
    });
}

export default class Queue {
  private readonly processor: QueueProcessor;

  constructor(processor: QueueProcessor) {
    this.processor = processor;
  }

  process(inputs: any[]) {
    const outputs = [];

    return process(inputs.slice(), outputs, this.processor);
  }

  static process(inputs: any[], processor: QueueProcessor): Promise<any[]> {
    return process(inputs.slice(), [], processor);
  }
};
