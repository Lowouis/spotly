// Helper method to wait for a middleware to execute before continuing
const runMiddleware = (req, res) => {
    return Promise.resolve();
};

export { runMiddleware };