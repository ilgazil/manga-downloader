function process(inputs: any[], processed: any[], processor: QueueProcessor): Promise<any> {
  if (!inputs.length) {
    return Promise.resolve(processed);
  }

  const input = inputs.shift();

  return processor(input)
    .then((output) => {
      processed.push(output);
      return process(inputs, processed, processor)
    })
    .catch((error) => {
      console.log(error);
      return process(inputs, processed, processor)
    });
}

export interface QueueProcessor {
  (input: any): Promise<any>
}

export function queue(inputs: any[], processor: QueueProcessor) {
  const processed = [];

  return process(inputs.slice(), processed, processor);
}
