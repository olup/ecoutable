import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import * as docker from "@pulumi/docker";
import * as command from "@pulumi/command";
import * as synced_folder from "@pulumi/synced-folder";
import * as path from "path"; // Import path module

// Configurations
const config = new pulumi.Config();
const serviceName = "ecoutable";
const region = "us-central1";
const gcpConfig = new pulumi.Config("gcp");
const project = gcpConfig.require("project");

// Environment variables from config
const geminiApiKey = config.requireSecret("geminiApiKey");
const replicateApiKey = config.requireSecret("replicateApiKey");

// ✅ Enable required GCP services
const services = [
  "run.googleapis.com",
  "artifactregistry.googleapis.com",
  "cloudbuild.googleapis.com",
  "storage.googleapis.com",
  "iam.googleapis.com",
];

services.forEach((service) => {
  new gcp.projects.Service(service, {
    service: service,
    disableOnDestroy: false,
  });
});

// ✅ Create an Artifact Registry repository
const repo = new gcp.artifactregistry.Repository("my-repo", {
  format: "DOCKER",
  location: region,
  repositoryId: serviceName,
});

// ✅ Define the Docker image path
const registryHost = `${region}-docker.pkg.dev`;
const imageTag = new Date().getTime().toString();
const imageName = `${registryHost}/${project}/${serviceName}/${serviceName}:${imageTag}`;

// Build Docker image after repo is created
const dockerImage = new docker.Image(
  serviceName,
  {
    imageName: imageName,
    build: {
      context: "../",
      dockerfile: "../Dockerfile",
    },
    registry: {
      server: registryHost,
      username: "oauth2accesstoken",
      password: gcp.config.accessToken,
    },
  },
  {
    dependsOn: [repo],
  }
);

// ✅ Create a Cloud Storage bucket for backend data
const bucket = new gcp.storage.Bucket(`${serviceName}-bucket`, {
  location: region,
  uniformBucketLevelAccess: true,
});

// ✅ Create service account for Cloud Run
const computeServiceAccount = new gcp.serviceaccount.Account("cloud-run-sa", {
  accountId: `${serviceName}-sa`,
  displayName: "Service Account for Cloud Run",
});

// ✅ Deploy to Cloud Run (after Docker image is built)
const service = new gcp.cloudrun.Service(
  serviceName,
  {
    location: region,
    template: {
      spec: {
        serviceAccountName: computeServiceAccount.email,
        containers: [
          {
            image: imageName,
            ports: [{ containerPort: 3333 }],
            envs: [
              {
                name: "GEMINI_API_KEY",
                value: geminiApiKey,
              },
              {
                name: "REPLICATE_API_TOKEN",
                value: replicateApiKey,
              },
              {
                name: "BUCKET_NAME",
                value: pulumi.interpolate`${bucket.name}`,
              },
            ],
          },
        ],
      },
    },
  },
  {
    dependsOn: [dockerImage],
  }
);

// ✅ Allow public access to Cloud Run service
new gcp.cloudrun.IamMember(`${serviceName}-invoker`, {
  service: service.name,
  location: service.location,
  role: "roles/run.invoker",
  member: "allUsers",
});

// Grant necessary IAM roles to the service account
const requiredRoles = {
  // Project-level roles
  project: [
    "roles/iam.serviceAccountTokenCreator", // For signing URLs
    "roles/iam.serviceAccountKeyAdmin", // For managing keys and signing blobs
    "roles/iam.serviceAccountUser", // For impersonating the service account
  ],
  // Bucket-level roles
  bucket: [
    "roles/storage.admin", // Full access to storage objects
  ],
  // Service account-level roles
  serviceAccount: [
    "roles/iam.serviceAccountTokenCreator", // Self-token creation (includes signing)
    "roles/iam.serviceAccountKeyAdmin", // Self-management of keys
    "roles/iam.serviceAccountUser", // Self-impersonation
  ],
};

// Apply project-level roles
requiredRoles.project.forEach((role) => {
  new gcp.projects.IAMMember(`project-${role}`, {
    project: project,
    role: role,
    member: pulumi.interpolate`serviceAccount:${computeServiceAccount.email}`,
  });
});

// Apply bucket-level roles
requiredRoles.bucket.forEach((role) => {
  new gcp.storage.BucketIAMMember(`bucket-${role}`, {
    bucket: bucket.name,
    role: role,
    member: pulumi.interpolate`serviceAccount:${computeServiceAccount.email}`,
  });
});

// Apply service account-level roles
requiredRoles.serviceAccount.forEach((role) => {
  new gcp.serviceaccount.IAMMember(`sa-${role}`, {
    serviceAccountId: computeServiceAccount.name,
    role: role,
    member: pulumi.interpolate`serviceAccount:${computeServiceAccount.email}`,
  });
});
// --- Outputs ---

// ✅ Output the URL of the deployed service, backend bucket name, and frontend website URL
export const backendUrl = service.statuses[0].url;
export const backendBucketName = bucket.name; // Bucket for backend data
// For a custom domain or nicer URL, you'd typically set up a Load Balancer or CDN pointing to the bucket.
