import { json, redirect } from "@remix-run/node";
import {
  Form,
  useActionData,
  useTransition,
  useLoaderData,
} from "@remix-run/react";
import invariant from "tiny-invariant";
import { getPost, createPost, updatePost } from "~/models/post.server";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import type { Post } from "~/models/post.server";

type ActionData =
  | {
      title: null | string;
      slug: null | string;
      markdown: null | string;
    }
  | undefined;

type LoaderData = { post: Post };

export const loader: LoaderFunction = async ({ params }) => {
  invariant(params.slug, `params.slug is required`);

  if (params.slug === "new") {
    return json({});
  }

  const post = await getPost(params.slug);
  invariant(post, `Post not found: ${params.slug}`);

  return json({ post });
};

export const action: ActionFunction = async ({ request, params }) => {
  const formData = await request.formData();

  const title = formData.get("title");
  const slug = formData.get("slug");
  const markdown = formData.get("markdown");

  const errors: ActionData = {
    title: title ? null : "Title is required",
    slug: slug ? null : "Slug is required",
    markdown: markdown ? null : "Markdown is required",
  };
  const hasErrors = Object.values(errors).some((errorMessage) => errorMessage);
  if (hasErrors) {
    return json<ActionData>(errors);
  }

  invariant(typeof title === "string", "title must be a string");
  invariant(typeof slug === "string", "slug must be a string");
  invariant(typeof markdown === "string", "markdown must be a string");

  if (params.slug === "new") {
    await createPost({ title, slug, markdown });
  }
  {
    await updatePost(slug, { title, slug, markdown });
  }

  return redirect("/posts/admin");
};

const inputClassName = `w-full rounded border border-gray-500 px-2 py-1 text-lg`;

export default function NewPost() {
  const errors = useActionData();
  const { post } = useLoaderData() as LoaderData;
  const { title, slug, markdown } = post;

  const transition = useTransition();
  const isCreating = Boolean(transition.submission);

  return (
    <Form method="post" key={slug ?? "new"}>
      <p>
        <label htmlFor="title">
          Post Title:{" "}
          {errors?.title ? (
            <em className="text-red-600">{errors.title}</em>
          ) : null}
          <input
            type="text"
            name="title"
            className={inputClassName}
            defaultValue={title}
          />
        </label>
      </p>
      <p>
        <label htmlFor="slug">
          Post Slug:{" "}
          {errors?.slug ? (
            <em className="text-red-600">{errors.slug}</em>
          ) : null}
          <input
            type="text"
            name="slug"
            className={inputClassName}
            defaultValue={slug}
          />
        </label>
      </p>
      <p>
        <label htmlFor="markdown">Markdown:</label>
        {errors?.markdown ? (
          <em className="text-red-600">{errors.markdown}</em>
        ) : null}
        <br />
        <textarea
          id="markdown"
          rows={20}
          name="markdown"
          className={`${inputClassName} font-mono`}
          defaultValue={markdown}
        />
      </p>
      <p className="text-right">
        <button
          type="submit"
          disabled={isCreating}
          className="rounded bg-blue-500 py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400 disabled:bg-blue-300"
        >
          {isCreating && slug === "new"
            ? "Creating..."
            : isCreating && slug === "new"
            ? "Updating..."
            : slug === "new"
            ? "Create Post"
            : "Update Post"}
        </button>
      </p>
    </Form>
  );
}
