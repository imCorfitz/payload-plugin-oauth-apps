import { mongooseAdapter } from "@payloadcms/db-mongodb";
import { slateEditor } from "@payloadcms/richtext-slate";
import { webpackBundler } from "@payloadcms/bundler-webpack";
import { buildConfig } from "payload/config";
import path from "path";
// import Examples from './collections/Examples';
import Users from "./collections/Users";

// import { oAuthApps } from '../../dist';
// eslint-disable-next-line import/no-relative-packages
import { oAuthApps } from "../../src";

export default buildConfig({
  serverURL: "http://localhost:3030",
  admin: {
    user: Users.slug,
    bundler: webpackBundler(),
  },
  email: {
    fromName: "Admin",
    fromAddress: "admin@example.com",
    logMockCredentials: true, // Optional
  },
  editor: slateEditor({}),
  csrf: [],
  cors: [],
  collections: [
    Users,
    // Add Collections here
    // Examples,
  ],
  typescript: {
    outputFile: path.resolve(__dirname, "payload-types.ts"),
  },
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, "generated-schema.graphql"),
  },
  db: mongooseAdapter({
    url: process.env.MONGODB_URI,
  }),
  plugins: [
    oAuthApps({
      userCollections: [Users.slug],
      sessions: {
        limit: 4,
        ipinfoApiKey: process.env.IPINFO_API_KEY,
      },
      access: {
        sessions: {
          read: () => true,
          update: () => true,
        },
      },
    }),
  ],
});
