const handler = async (event: any) => {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ message: 'Getting Artists!' }),
  };
};

export { handler };
