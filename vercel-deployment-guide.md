# Deploying GuruKool-HomeSchool to Vercel

This guide provides step-by-step instructions for deploying the GuruKool-HomeSchool application to Vercel.

## Prerequisites

1. A GitHub account with the GuruKool-HomeSchool repository
2. A Vercel account (you can sign up at [vercel.com](https://vercel.com) using your GitHub account)

## Deployment Steps

### 1. Push Code to GitHub

First, ensure your code is pushed to the GitHub repository:

1. Extract the `gurukool-homeschool-src.zip` file to your local machine
2. Initialize a Git repository (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit with TypeScript fixes"
   ```
3. Connect to your GitHub repository:
   ```bash
   git remote add origin https://github.com/maneabhishek1983/GuruKool-HomeSchool.git
   git push -u origin main
   ```

### 2. Connect Vercel to GitHub

1. Go to [vercel.com](https://vercel.com) and sign in with your GitHub account
2. Click "Add New..." and select "Project"
3. Import the GuruKool-HomeSchool repository from GitHub
4. Vercel will automatically detect that this is a Next.js project

### 3. Configure Project Settings

1. Project Name: Enter "gurukool-homeschool" or your preferred name
2. Framework Preset: Ensure "Next.js" is selected
3. Root Directory: Leave as default (/)
4. Build Command: Leave as default (`next build`)
5. Output Directory: Leave as default (`.next`)
6. Install Command: Leave as default (`npm install`)

### 4. Environment Variables (if needed)

If your application requires environment variables:

1. Expand the "Environment Variables" section
2. Add any required variables (e.g., API endpoints, authentication keys)
3. Make sure to set different values for Production, Preview, and Development environments if needed

### 5. Deploy

1. Click "Deploy"
2. Vercel will build and deploy your application
3. Once complete, you'll receive a deployment URL (e.g., `https://gurukool-homeschool.vercel.app`)

### 6. Custom Domain (Optional)

To use a custom domain:

1. Go to the project dashboard
2. Click "Settings" > "Domains"
3. Add your custom domain and follow the verification steps

## Continuous Deployment

Vercel automatically sets up continuous deployment:

- Any push to the main branch will trigger a new production deployment
- Pull requests create preview deployments for testing before merging

## Monitoring and Logs

After deployment:

1. Go to your project dashboard to monitor performance
2. View deployment logs by clicking on a specific deployment
3. Check Function Logs for serverless function performance

## Troubleshooting

If you encounter issues during deployment:

1. Check the build logs for errors
2. Ensure all dependencies are correctly listed in package.json
3. Verify that your Next.js configuration is correct
4. Check that environment variables are properly set

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
