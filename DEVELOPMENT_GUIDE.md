# Loctech Development Guide - Implementation Patterns

## Quick Reference for Common Tasks

### 📝 Creating a New Database Model

**Pattern**: Model → Controller → API Route → Component → Page

```typescript
// Step 1: Define Model (backend/models/feature.model.ts)
import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

const FeatureSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      index: true, // Index frequently queried fields
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// Add composite indexes for common queries
FeatureSchema.index({ status: 1, createdBy: 1 });

export type Feature = InferSchemaType<typeof FeatureSchema>;
export const FeatureModel: Model<Feature> =
  (mongoose.models.Feature as Model<Feature>) ||
  mongoose.model<Feature>("Feature", FeatureSchema);
```

**Key Points**:
- Use `trim: true` for string fields
- Add `index: true` for filtered/sorted fields
- Use `timestamps: true` for audit trail
- Type inference with `InferSchemaType`
- Prevent model re-registration

---

### 🔧 Creating a Controller

```typescript
// backend/controllers/feature.controller.ts
import { FeatureModel } from "../models/feature.model";
import { Feature } from "../models/feature.model";

/**
 * Get all features
 * @param filter - Optional query filters
 * @returns Array of features
 */
export async function getAllFeatures(filter?: Record<string, any>) {
  try {
    return await FeatureModel.find(filter || {})
      .populate("createdBy", "name email role") // Load related data
      .lean() // Return plain JS objects (faster)
      .exec();
  } catch (error) {
    throw new Error(`Failed to fetch features: ${error}`);
  }
}

/**
 * Get feature by ID
 * @param id - Feature ID
 * @returns Feature document or null
 */
export async function getFeatureById(id: string) {
  try {
    return await FeatureModel.findById(id)
      .populate("createdBy", "name email role")
      .lean();
  } catch (error) {
    throw new Error(`Failed to fetch feature: ${error}`);
  }
}

/**
 * Create new feature
 * @param data - Feature data
 * @param userId - Creator user ID
 * @returns Created feature
 */
export async function createFeature(
  data: Partial<Feature>,
  userId: string
) {
  try {
    // Validation happens in API route
    const feature = new FeatureModel({
      ...data,
      createdBy: userId,
    });
    await feature.save();
    return feature.toObject();
  } catch (error) {
    throw new Error(`Failed to create feature: ${error}`);
  }
}

/**
 * Update feature
 * @param id - Feature ID
 * @param data - Fields to update
 * @returns Updated feature
 */
export async function updateFeature(id: string, data: Partial<Feature>) {
  try {
    return await FeatureModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true } // Return updated doc, validate
    )
      .populate("createdBy", "name email role")
      .lean();
  } catch (error) {
    throw new Error(`Failed to update feature: ${error}`);
  }
}

/**
 * Delete feature
 * @param id - Feature ID
 * @returns Deleted feature
 */
export async function deleteFeature(id: string) {
  try {
    return await FeatureModel.findByIdAndDelete(id);
  } catch (error) {
    throw new Error(`Failed to delete feature: ${error}`);
  }
}

/**
 * Get features by creator
 * @param userId - Creator user ID
 * @returns Array of features created by user
 */
export async function getFeaturesByCreator(userId: string) {
  try {
    return await FeatureModel.find({ createdBy: userId })
      .sort({ createdAt: -1 }) // Most recent first
      .lean();
  } catch (error) {
    throw new Error(`Failed to fetch creator features: ${error}`);
  }
}
```

**Controller Best Practices**:
- Add JSDoc comments for every function
- Use `.lean()` for read operations (faster)
- Use `.populate()` to load references
- Handle errors consistently
- Add filtering/sorting parameters
- Return plain objects, not Mongoose docs

---

### 🌐 Creating API Routes

```typescript
// app/api/feature/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import {
  getAllFeatures,
  createFeature,
} from "@/backend/controllers/feature.controller";
import { errorResponse, successResponse } from "@/lib/server-helper";

/**
 * GET /api/feature
 * List all features (with optional filters)
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authConfig);
    if (!session) {
      return errorResponse("Unauthorized", 401);
    }

    // Optional: Check authorization
    if (
      session.user.role !== "admin" &&
      session.user.role !== "super_admin"
    ) {
      return errorResponse("Access denied", 403);
    }

    // Extract query parameters
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status");

    // Build filter
    const filter: Record<string, any> = {};
    if (status) filter.status = status;

    const data = await getAllFeatures(filter);
    return successResponse(data);
  } catch (error) {
    console.error("GET /api/feature error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to fetch features",
      500
    );
  }
}

/**
 * POST /api/feature
 * Create a new feature
 * Body: { name, description, status?, ... }
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authConfig);
    if (!session) {
      return errorResponse("Unauthorized", 401);
    }

    // Check authorization
    if (
      session.user.role !== "admin" &&
      session.user.role !== "super_admin"
    ) {
      return errorResponse("Access denied", 403);
    }

    // Parse request body
    const body = await req.json();

    // Validate required fields
    if (!body.name) {
      return errorResponse("Name is required", 400);
    }

    // Create via controller
    const data = await createFeature(body, session.user.id);

    // Return success
    return successResponse(data, "Feature created successfully", 201);
  } catch (error) {
    console.error("POST /api/feature error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to create feature",
      500
    );
  }
}
```

**Dynamic Routes** (for specific IDs):

```typescript
// app/api/feature/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import {
  getFeatureById,
  updateFeature,
  deleteFeature,
} from "@/backend/controllers/feature.controller";
import { errorResponse, successResponse } from "@/lib/server-helper";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authConfig);
    if (!session) return errorResponse("Unauthorized", 401);

    const data = await getFeatureById(id);
    if (!data) return errorResponse("Feature not found", 404);

    return successResponse(data);
  } catch (error) {
    console.error("GET /api/feature/[id] error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to fetch feature",
      500
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authConfig);
    if (!session) return errorResponse("Unauthorized", 401);

    // Check if user owns resource (optional, depends on requirements)
    const existing = await getFeatureById(id);
    if (!existing) return errorResponse("Feature not found", 404);

    const body = await req.json();
    const data = await updateFeature(id, body);

    return successResponse(data, "Feature updated successfully");
  } catch (error) {
    console.error("PUT /api/feature/[id] error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to update feature",
      500
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authConfig);
    if (!session) return errorResponse("Unauthorized", 401);

    if (session.user.role !== "admin" && session.user.role !== "super_admin") {
      return errorResponse("Access denied", 403);
    }

    const data = await deleteFeature(id);
    if (!data) return errorResponse("Feature not found", 404);

    return successResponse(null, "Feature deleted successfully");
  } catch (error) {
    console.error("DELETE /api/feature/[id] error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to delete feature",
      500
    );
  }
}
```

**API Route Best Practices**:
- Use `errorResponse()` and `successResponse()` helpers
- Always check `getServerSession()` for auth
- Validate user role for authorization
- Validate request body
- Handle errors with try-catch
- Return appropriate HTTP status codes
- Use JSDoc for endpoints

---

### 🎨 Creating React Components

```typescript
// components/feature/feature-list.tsx
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/spinner";
import { useState } from "react";

interface Feature {
  _id: string;
  name: string;
  description: string;
  status: string;
  createdAt: string;
}

export function FeatureList() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Fetch features
  const { data, isLoading, error } = useQuery({
    queryKey: ["features"],
    queryFn: async () => {
      const res = await fetch("/api/feature");
      if (!res.ok) throw new Error("Failed to fetch features");
      return res.json();
    },
  });

  // Delete mutation
  const deleteFeatureMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/feature/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      // Refetch list
      queryClient.invalidateQueries({ queryKey: ["features"] });
      setSelectedId(null);
    },
  });

  if (isLoading) return <Spinner />;
  if (error) return <div className="text-red-500">Error: {error.message}</div>;

  const features: Feature[] = data?.data || [];

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {features.map((feature) => (
            <TableRow key={feature._id}>
              <TableCell className="font-medium">{feature.name}</TableCell>
              <TableCell>{feature.description}</TableCell>
              <TableCell>
                <span
                  className={`px-2 py-1 rounded text-sm font-medium ${
                    feature.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {feature.status}
                </span>
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button variant="outline" size="sm">
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (confirm("Delete this feature?")) {
                      deleteFeatureMutation.mutate(feature._id);
                    }
                  }}
                  disabled={deleteFeatureMutation.isPending}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {features.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No features found
        </div>
      )}
    </div>
  );
}
```

**Component Best Practices**:
- Use `"use client"` directive for interactive components
- Use TanStack React Query for data fetching
- Show loading/error states
- Use shadcn/ui components for consistency
- Add loading indicators on actions
- Confirm destructive actions
- Invalidate queries after mutations

---

### 📄 Creating Pages

```typescript
// app/dashboard/feature/page.tsx
import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";
import { FeatureList } from "@/components/feature/feature-list";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
  },
  {
    title: "Features",
    href: "/dashboard/feature",
  },
];

export default function FeaturePage() {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Features</h1>
          <Button asChild>
            <Link href="/dashboard/feature/new">Create Feature</Link>
          </Button>
        </div>

        <hr />

        {/* Content */}
        <FeatureList />
      </div>
    </AppLayout>
  );
}
```

---

## Common Query Patterns

### Authentication Check
```typescript
const session = await getServerSession(authConfig);
if (!session) return errorResponse("Unauthorized", 401);
```

### Role-Based Authorization
```typescript
const isAdmin = session?.user.role === "admin" || 
               session?.user.role === "super_admin";
if (!isAdmin) return errorResponse("Access denied", 403);
```

### Ownership Check
```typescript
const resource = await getResourceById(id);
if (resource.createdBy !== session.user.id) {
  return errorResponse("Access denied", 403);
}
```

### Get Student's Own Data
```typescript
// In student app, only allow accessing own data
const targetId = searchParams.get("studentId") || session.user.id;
if (session.user.id !== targetId) {
  return errorResponse("Access denied", 403);
}
```

---

## Error Handling Pattern

```typescript
// lib/server-helper.ts (already exists, use consistently)

export function successResponse(data: any, message?: string, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      message: message || "Success",
    },
    { status }
  );
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      statusCode: status,
    },
    { status }
  );
}
```

Always use these helpers for consistent API responses!

---

## Common Mistakes to Avoid

❌ **Don't**: Return Mongoose documents directly
```typescript
// Bad
return FeatureModel.findById(id); // Returns Mongoose doc
```

✅ **Do**: Return plain objects
```typescript
// Good
return FeatureModel.findById(id).lean(); // Returns plain object
```

---

❌ **Don't**: Forget authorization checks
```typescript
// Bad - Anyone can delete
export async function DELETE(req) {
  const { id } = await params;
  await deleteFeature(id);
}
```

✅ **Do**: Check authorization
```typescript
// Good
export async function DELETE(req) {
  const session = await getServerSession(authConfig);
  if (!session) return errorResponse("Unauthorized", 401);
  // ... rest of logic
}
```

---

❌ **Don't**: Skip input validation
```typescript
// Bad
const { name, email } = await req.json();
await createUser(name, email);
```

✅ **Do**: Validate inputs
```typescript
// Good
const body = await req.json();
if (!body.name || !body.email) {
  return errorResponse("Name and email required", 400);
}
await createUser(body.name, body.email);
```

---

❌ **Don't**: Use hardcoded IDs or references
```typescript
// Bad - assumes User model exists
const user = await UserModel.findById(userId);
```

✅ **Do**: Use proper relationships
```typescript
// Good - populate reference
const feature = await FeatureModel.findById(featureId)
  .populate("createdBy");
```

---

## Database Query Optimization

### ✅ Good: Use indexes
```typescript
// For frequently filtered fields
FeatureSchema.index({ status: 1 });
FeatureSchema.index({ createdBy: 1 });
FeatureSchema.index({ status: 1, createdBy: 1 }); // Composite
```

### ✅ Good: Use `.lean()` for reads
```typescript
// Faster, returns plain object
return FeatureModel.find().lean();
```

### ✅ Good: Select specific fields
```typescript
// Only fetch what you need
return FeatureModel.find()
  .select("name status createdAt") // Exclude others
  .lean();
```

### ✅ Good: Limit results
```typescript
// Pagination
return FeatureModel.find()
  .skip((page - 1) * limit)
  .limit(limit)
  .lean();
```

---

## Security Best Practices

1. **Always validate input** - Check request body data
2. **Check authentication** - Verify session exists
3. **Check authorization** - Verify user role
4. **Check ownership** - Verify user owns resource
5. **Use HTTPS only** - Enforce in production
6. **Hash passwords** - Use bcrypt (already configured)
7. **Limit data exposure** - Don't return sensitive fields
8. **Log important actions** - For audit trail

---

## Testing Your Feature Locally

```bash
# Start both apps
cd loctech-team && npm run dev &
cd loctech-student && npm run dev &

# Test API endpoints with curl
curl http://localhost:3000/api/feature

# Or use Postman/Insomnia for more complex requests
```

---

**Last Updated**: March 2026
