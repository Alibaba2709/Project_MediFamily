import Link from "next/link";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { connectMongo } from "@/app/lib/mongodb";
import { requireVerifiedUser } from "@/app/lib/auth";
import { getFamilyMembers } from "@/app/lib/family";
import { Recipe } from "@/app/models/Recipe";
import { RecipeForm } from "@/app/components/RecipeForm";
import { DeleteButton } from "@/app/components/DeleteButton";
import { MemberAvatar } from "@/app/components/MemberAvatar";

type StoredRecipe = {
  _id: { toString: () => string };
  memberName: string;
  medicationName: string;
  recipeCode?: string;
  doctor?: string;
  renewalDate?: Date;
  status: "active" | "to-renew" | "renewed";
  notes?: string;
};

async function getRecipes(familyId: string) {
  try {
    await connectMongo();

    const recipes = await Recipe.find({ familyId })
      .sort({ createdAt: -1 })
      .lean<StoredRecipe[]>();

    return recipes.map((recipe) => ({
      id: recipe._id.toString(),
      memberName: recipe.memberName,
      medicationName: recipe.medicationName,
      recipeCode: recipe.recipeCode,
      doctor: recipe.doctor,
      renewalDate: recipe.renewalDate?.toISOString(),
      status: recipe.status,
      notes: recipe.notes,
    }));
  } catch {
    return [];
  }
}

function formatDate(value?: string) {
  if (!value) return "Non impostata";
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function statusLabel(status: StoredRecipe["status"]) {
  const labels = {
    active: "Attiva",
    "to-renew": "Da rinnovare",
    renewed: "Rinnovata",
  };

  return labels[status];
}

type RecipeItem = Awaited<ReturnType<typeof getRecipes>>[number];

function groupRecipesByMember(
  recipes: RecipeItem[],
  members: Awaited<ReturnType<typeof getFamilyMembers>>
) {
  const knownMemberNames = new Set(members.map((member) => member.name));
  const memberGroups = members
    .map((member) => ({
      ...member,
      recipes: recipes.filter((recipe) => recipe.memberName === member.name),
    }))
    .filter((group) => group.recipes.length > 0);
  const savedOnlyNames = Array.from(
    new Set(
      recipes
        .map((recipe) => recipe.memberName)
        .filter((name) => name && !knownMemberNames.has(name))
    )
  );

  return [
    ...memberGroups,
    ...savedOnlyNames.map((name) => ({
      name,
      role: "Profilo salvato",
      tone: "bg-[#f7e2bf]",
      imageDataUrl: undefined,
      recipes: recipes.filter((recipe) => recipe.memberName === name),
    })),
  ];
}

export default async function RecipesPage() {
  const user = await requireVerifiedUser();
  const canEdit = user.role !== "viewer";
  const members = await getFamilyMembers(user);
  const recipes = await getRecipes(user.familyId);
  const memberNames = Array.from(
    new Set([
      ...members.map((member) => member.name),
      ...recipes.map((recipe) => recipe.memberName),
    ])
  ).filter(Boolean);
  const recipeGroups = groupRecipesByMember(recipes, members);

  return (
    <main className="min-h-screen bg-[#fffaf6] px-5 py-6 text-[#2f3330] sm:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <Link
            className="inline-flex h-10 items-center gap-2 rounded-md border border-[#e3d7cf] bg-white px-3 text-sm font-semibold text-[#4f5c55] shadow-sm transition hover:bg-[#f8f1ec]"
            href="/"
          >
            <ArrowLeft size={17} aria-hidden="true" />
            Dashboard
          </Link>
          {canEdit ? <RecipeForm familyMembers={memberNames} /> : null}
        </div>

        <section className="rounded-lg border border-[#eadfd7] bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex size-11 items-center justify-center rounded-lg bg-[#faf7ff] text-[#5d527b]">
              <ClipboardList size={22} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#947b6a]">
                Archivio salute
              </p>
              <h1 className="mt-1 text-3xl font-semibold text-[#29302d]">
                Ricette
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6c5f57]">
                Inserisci ricette da rinnovare, promemoria e medico collegato.
              </p>
            </div>
          </div>
        </section>

        {recipes.length > 0 ? (
          <section className="grid gap-4">
            {recipeGroups.map((group) => (
              <div
                className="rounded-lg border border-[#eadfd7] bg-[#fffdfb] p-4 shadow-sm"
                key={group.name}
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <MemberAvatar
                      imageDataUrl={group.imageDataUrl}
                      name={group.name}
                      tone={group.tone}
                    />
                    <div>
                      <h2 className="text-sm font-semibold text-[#29302d]">
                        {group.name}
                      </h2>
                      <p className="text-xs text-[#7a6f68]">{group.role}</p>
                    </div>
                  </div>
                  <span className="rounded-md bg-[#faf7ff] px-2 py-1 text-xs font-semibold text-[#5d527b]">
                    {group.recipes.length === 1
                      ? "1 ricetta"
                      : `${group.recipes.length} ricette`}
                  </span>
                </div>

                <div className="grid gap-3">
                  {group.recipes.map((recipe) => (
                    <article
                      className="rounded-lg border border-[#eadfd7] bg-white p-4"
                      key={recipe.id}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-[#29302d]">
                          {recipe.medicationName}
                        </h3>
                        <span className="rounded-md bg-[#faf7ff] px-2 py-1 text-xs font-semibold text-[#5d527b]">
                          {statusLabel(recipe.status)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-[#6c5f57]">
                        {recipe.doctor ? recipe.doctor : "Medico non impostato"}
                      </p>
                      <p className="mt-3 text-sm text-[#6c5f57]">
                        Codice ricetta: {recipe.recipeCode || "Non impostato"}
                      </p>
                      <p className="mt-1 text-sm text-[#6c5f57]">
                        Rinnovare entro: {formatDate(recipe.renewalDate)}
                      </p>
                      {recipe.notes ? (
                        <p className="mt-2 text-sm leading-6 text-[#6c5f57]">
                          {recipe.notes}
                        </p>
                      ) : null}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {canEdit ? (
                          <>
                            <RecipeForm
                              mode="edit"
                              recipe={recipe}
                              familyMembers={memberNames}
                            />
                            <DeleteButton
                              endpoint={`/api/recipes/${recipe.id}`}
                              label={recipe.medicationName}
                            />
                          </>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </section>
        ) : (
          <section className="rounded-lg border border-dashed border-[#d9cfc6] bg-white p-6 text-center shadow-sm">
            <ClipboardList
              size={28}
              className="mx-auto text-[#947b6a]"
              aria-hidden="true"
            />
            <h2 className="mt-3 text-base font-semibold text-[#29302d]">
              Nessuna ricetta inserita
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6c5f57]">
              Premi Ricetta per aggiungere la prima ricetta da seguire.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
