"use client";

import { useCallback, useEffect, useState } from "react";
import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	ChevronLeft,
	ChevronRight,
	Eye,
	EyeOff,
	Plus,
} from "lucide-react";
import { useForm } from "react-hook-form";

import { createUserSchema } from "@/app/api/users/validations";
import type { CreateUserInput } from "@/app/api/users/validations";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

export type UserRow = {
	id: number;
	username: string;
	email: string;
};

const SORT_COLUMNS = ["username", "email"] as const;
type SortColumn = (typeof SORT_COLUMNS)[number];
type SortOrder = "asc" | "desc";

const COLUMN_LABELS: Record<SortColumn, string> = {
	username: "Username",
	email: "Email",
};

type ApiResponse = {
	data: UserRow[];
	pagination: {
		page: number;
		pageSize: number;
		total: number;
		totalPages: number;
	};
};

function UserViewDrawer({ user }: { user: UserRow }) {
	const isMobile = useIsMobile();

	return (
		<Drawer direction={isMobile ? "bottom" : "right"}>
			<DrawerTrigger asChild>
				<Button
					variant="link"
					className="text-foreground w-fit px-0 text-left font-medium"
				>
					{user.username}
				</Button>
			</DrawerTrigger>
			<DrawerContent>
				<DrawerHeader className="gap-1">
					<DrawerTitle>{user.username}</DrawerTitle>
					<DrawerDescription>
						User details
					</DrawerDescription>
				</DrawerHeader>
				<div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
					<div className="flex flex-col gap-3">
						<Label htmlFor="user-username" className="text-muted-foreground">
							Username
						</Label>
						<Input
							id="user-username"
							value={user.username}
							readOnly
							className="bg-muted"
						/>
					</div>
					<div className="flex flex-col gap-3">
						<Label htmlFor="user-email" className="text-muted-foreground">
							Email
						</Label>
						<Input
							id="user-email"
							value={user.email}
							readOnly
							className="bg-muted"
						/>
					</div>
				</div>
				<DrawerFooter>
					<DrawerClose asChild>
						<Button variant="outline">Done</Button>
					</DrawerClose>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}

export function UsersTable() {
	const [data, setData] = useState<UserRow[]>([]);
	const [page, setPage] = useState(1);
	const [pageSize] = useState(15);
	const [total, setTotal] = useState(0);
	const [totalPages, setTotalPages] = useState(0);
	const [search, setSearch] = useState("");
	const [searchInput, setSearchInput] = useState("");
	const [sortBy, setSortBy] = useState<SortColumn | null>(null);
	const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
	const [loading, setLoading] = useState(true);
	const [addOpen, setAddOpen] = useState(false);
	const [addSubmitting, setAddSubmitting] = useState(false);
	const [addError, setAddError] = useState<string | null>(null);
	const [showPassword, setShowPassword] = useState(false);

	const addForm = useForm<CreateUserInput>({
		defaultValues: {
			username: "",
			email: "",
			password: "",
		},
	});

	const fetchUsers = useCallback(async () => {
		setLoading(true);
		try {
			const params = new URLSearchParams();
			params.set("page", String(page));
			params.set("pageSize", String(pageSize));
			if (search) params.set("search", search);
			if (sortBy) {
				params.set("sortBy", sortBy);
				params.set("sortOrder", sortOrder);
			}
			const res = await fetch(`/api/users?${params}`);
			if (!res.ok) throw new Error("Failed to fetch");
			const json: ApiResponse = await res.json();
			setData(json.data);
			setTotal(json.pagination.total);
			setTotalPages(json.pagination.totalPages);
		} catch {
			setData([]);
			setTotal(0);
			setTotalPages(0);
		} finally {
			setLoading(false);
		}
	}, [page, pageSize, search, sortBy, sortOrder]);

	useEffect(() => {
		fetchUsers();
	}, [fetchUsers]);

	const handleSearchSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setSearch(searchInput.trim());
		setPage(1);
	};

	const handleAddSubmit = async (data: CreateUserInput) => {
		const parsed = createUserSchema.safeParse(data);
		if (!parsed.success) {
			parsed.error.issues.forEach((issue) => {
				const path = issue.path[0];
				if (path && typeof path === "string") {
					addForm.setError(path as keyof CreateUserInput, {
						message: issue.message,
					});
				}
			});
			return;
		}
		setAddError(null);
		setAddSubmitting(true);
		try {
			const res = await fetch("/api/users", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					username: parsed.data.username.trim(),
					email: parsed.data.email.trim().toLowerCase(),
					password: parsed.data.password,
				}),
			});
			const json = await res.json().catch(() => ({}));
			if (!res.ok) {
				setAddError(json.error ?? "Failed to add user.");
				return;
			}
			setAddOpen(false);
			addForm.reset();
			fetchUsers();
		} catch {
			setAddError("Failed to add user.");
		} finally {
			setAddSubmitting(false);
		}
	};

	const cycleSort = (column: SortColumn) => {
		if (sortBy !== column) {
			setSortBy(column);
			setSortOrder("asc");
		} else if (sortOrder === "asc") {
			setSortOrder("desc");
		} else {
			setSortBy(null);
			setSortOrder("asc");
		}
		setPage(1);
	};

	const SortHeader = ({ column }: { column: SortColumn }) => {
		const isActive = sortBy === column;
		const icon = !isActive ? (
			<ArrowUpDown className="size-4 opacity-50" />
		) : sortOrder === "asc" ? (
			<ArrowUp className="size-4" />
		) : (
			<ArrowDown className="size-4" />
		);
		return (
			<button
				type="button"
				className="flex items-center gap-1 font-medium hover:underline"
				onClick={() => cycleSort(column)}
			>
				{COLUMN_LABELS[column]}
				{icon}
			</button>
		);
	};

	return (
		<div className="w-full flex flex-col gap-4 px-4 lg:px-6">
			<div className="space-y-1">
				<h2 className="text-xl font-semibold tracking-tight">Users</h2>
				<p className="text-muted-foreground text-sm">
					View users. Search by username or email.
				</p>
			</div>
			<div className="flex items-center justify-between gap-4">
				<form onSubmit={handleSearchSubmit} className="flex gap-2">
					<Input
						placeholder="Search by username or email..."
						value={searchInput}
						onChange={(e) => setSearchInput(e.target.value)}
						className="min-w-[300px] w-full max-w-md"
					/>
					<Button type="submit" variant="secondary">
						Search
					</Button>
				</form>
				<Button onClick={() => setAddOpen(true)} variant="default">
					<Plus className="size-4" />
					Add
				</Button>
			</div>

			<Dialog
				open={addOpen}
				onOpenChange={(open) => {
					setAddOpen(open);
					if (!open) setShowPassword(false);
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Add user</DialogTitle>
						<DialogDescription>
							Create a new user. Password is stored as a secure hash.
						</DialogDescription>
					</DialogHeader>
					<Form {...addForm}>
						<form
							onSubmit={addForm.handleSubmit(handleAddSubmit)}
							className="grid gap-4"
						>
							{addError && (
								<p className="text-destructive text-sm">{addError}</p>
							)}
							<FormField
								control={addForm.control}
								name="username"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Username</FormLabel>
										<FormControl>
											<Input
												{...field}
												placeholder="Username"
												autoComplete="username"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={addForm.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email</FormLabel>
										<FormControl>
											<Input
												{...field}
												type="email"
												placeholder="user@example.com"
												autoComplete="email"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={addForm.control}
								name="password"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Password</FormLabel>
										<FormControl>
											<div className="relative">
												<Input
													{...field}
													type={showPassword ? "text" : "password"}
													placeholder="At least 6 characters"
													autoComplete="new-password"
													className="pr-10"
												/>
												<Button
													type="button"
													variant="ghost"
													size="icon"
													className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
													onClick={() => setShowPassword((p) => !p)}
													aria-label={showPassword ? "Hide password" : "Show password"}
												>
													{showPassword ? (
														<EyeOff className="size-4 text-muted-foreground" />
													) : (
														<Eye className="size-4 text-muted-foreground" />
													)}
												</Button>
											</div>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={() => setAddOpen(false)}
									disabled={addSubmitting}
								>
									Cancel
								</Button>
								<Button type="submit" disabled={addSubmitting}>
									{addSubmitting ? "Adding…" : "Add user"}
								</Button>
							</DialogFooter>
						</form>
					</Form>
				</DialogContent>
			</Dialog>

			<div className="relative flex flex-col gap-4 overflow-auto">
				<div className="overflow-hidden rounded-lg border">
					<Table>
						<TableHeader className="bg-muted sticky top-0 z-10">
							<TableRow>
							<TableHead>
								<SortHeader column="username" />
							</TableHead>
							<TableHead>
								<SortHeader column="email" />
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading ? (
							<TableRow>
								<TableCell
									colSpan={2}
									className="h-24 text-center text-muted-foreground"
								>
									Loading…
								</TableCell>
							</TableRow>
						) : data.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={2}
									className="h-24 text-center text-muted-foreground"
								>
									No users found.
								</TableCell>
							</TableRow>
						) : (
							data.map((user) => (
								<TableRow key={user.id}>
									<TableCell>
										<UserViewDrawer user={user} />
									</TableCell>
									<TableCell>{user.email}</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
					</Table>
				</div>
			</div>

			<div className="flex items-center justify-between gap-4">
				<p className="text-muted-foreground text-sm">
					{total === 0
						? "No rows"
						: `${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, total)} of ${total}`}
				</p>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="icon"
						onClick={() => setPage((p) => Math.max(1, p - 1))}
						disabled={page <= 1 || loading}
						aria-label="Previous page"
					>
						<ChevronLeft className="size-4" />
					</Button>
					<span className="text-sm font-medium">
						Page {page} of {totalPages || 1}
					</span>
					<Button
						variant="outline"
						size="icon"
						onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
						disabled={page >= totalPages || loading}
						aria-label="Next page"
					>
						<ChevronRight className="size-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}
