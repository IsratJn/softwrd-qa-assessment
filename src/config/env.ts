//Environment configuration

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable: "${key}". ` +
        `Ensure your .env file is set up (see .env.example).`,
    );
  }
  return value;
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const ENV = {
  baseUrl: optional("BASE_URL", "https://www.saucedemo.com"),

  users: {
    standard: {
      username: optional("STANDARD_USER", "standard_user"),
      password: optional("USER_PASSWORD", "secret_sauce"),
    },
    lockedOut: {
      username: optional("LOCKED_OUT_USER", "locked_out_user"),
      password: optional("USER_PASSWORD", "secret_sauce"),
    },
    problem: {
      username: optional("PROBLEM_USER", "problem_user"),
      password: optional("USER_PASSWORD", "secret_sauce"),
    },
    performanceGlitch: {
      username: optional("PERFORMANCE_GLITCH_USER", "performance_glitch_user"),
      password: optional("USER_PASSWORD", "secret_sauce"),
    },
    error: {
      username: optional("ERROR_USER", "error_user"),
      password: optional("USER_PASSWORD", "secret_sauce"),
    },
  },

  timeouts: {
    default: 30_000,
    performanceGlitch: parseInt(optional("PERF_GLITCH_TIMEOUT", "60000"), 10),
    element: 10_000,
  },
} as const;

export type UserCredentials = { username: string; password: string };
