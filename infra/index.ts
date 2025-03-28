import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import * as docker from "@pulumi/docker";

// Configurations
const config = new pulumi.Config();
const serviceName = "ecoutable";
const region = "us-central1";
const project = gcp.config.project;

// Environment variables from config
const geminiApiKey = config.requireSecret("geminiApiKey");
const replicateApiKey = config.requireSecret("replicateApiKey");

// ✅ Enable required GCP services
const services = [
  "run.googleapis.com",
  "artifactregistry.googleapis.com",
  "cloudbuild.googleapis.com",
  "storage.googleapis.com",
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
const imageName = `${region}-docker.pkg.dev/${project}/${serviceName}/${serviceName}:latest`;

// Build Docker image after repo is created
const dockerImage = new docker.Image(
  serviceName,
  {
    imageName: imageName,
    build: {
      context: "../",
      dockerfile: "../Dockerfile",
    },
  },
  {
    dependsOn: [repo],
  }
);

// ✅ Create a Cloud Storage bucket
const bucket = new gcp.storage.Bucket(`${serviceName}-bucket`, {
  location: region,
  uniformBucketLevelAccess: true,
});

// ✅ Deploy to Cloud Run (after Docker image is built)
const service = new gcp.cloudrun.Service(
  serviceName,
  {
    location: region,
    template: {
      spec: {
        containers: [
          {
            image: pulumi.interpolate`${imageName}`,
            ports: [{ containerPort: 3333 }],
            envs: [
              {
                name: "GEMINI_API_KEY",
                value: geminiApiKey,
              },
              {
                name: "REPLICATE_API_KEY",
                value: replicateApiKey,
              },
              {
                name: "BUCKET_NAME",
                value: pulumi.interpolate`${bucket.name}`,
              },
              {
                name: "FOO",
                value: "bar",
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

// ✅ Output the URL of the deployed service and bucket name
export const url = service.statuses[0].url;
export const bucketName = bucket.name;
