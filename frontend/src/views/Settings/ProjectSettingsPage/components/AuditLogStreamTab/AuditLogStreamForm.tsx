import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { createNotification } from "@app/components/notifications";
import { Button, FormControl, Input, Spinner } from "@app/components/v2";
import { useWorkspace } from "@app/context";
import {
	useCreateAuditLogStream,
	useGetAuditLogStreamDetails,
	useUpdateAuditLogStream
} from "@app/hooks/api";

type Props = {
	id?: string;
	onClose: () => void;
};

const formSchema = z.object({
	url: z.string().url().min(1),
	token: z.string().optional()
});
type TForm = z.infer<typeof formSchema>;

export const AuditLogStreamForm = ({ id = "", onClose }: Props) => {
	const isEdit = Boolean(id);
	const { currentWorkspace } = useWorkspace();
	const projectSlug = currentWorkspace?.slug || "";

	const auditLogStream = useGetAuditLogStreamDetails(id);
	const createAuditLogStream = useCreateAuditLogStream();
	const updateAuditLogStream = useUpdateAuditLogStream();

	const {
		handleSubmit,
		control,
		formState: { isSubmitting }
	} = useForm<TForm>({
		values: auditLogStream?.data
	});

	const handleAuditLogStreamEdit = async ({ token, url }: TForm) => {
		if (!id) return;
		try {
			await updateAuditLogStream.mutateAsync({
				id,
				projectSlug,
				token,
				url
			});
			createNotification({
				type: "success",
				text: "Successfully updated stream"
			});
			onClose();
		} catch (err) {
			console.log(err);
			createNotification({
				type: "error",
				text: "Failed to update stream"
			});
		}
	};

	const handleFormSubmit = async ({ token, url }: TForm) => {
		if (isSubmitting) return;
		if (isEdit) {
			handleAuditLogStreamEdit({ token, url });
			return;
		}
		try {
			await createAuditLogStream.mutateAsync({
				projectSlug,
				token,
				url
			});
			createNotification({
				type: "success",
				text: "Successfully created stream"
			});
			onClose();
		} catch (err) {
			console.log(err);
			createNotification({
				type: "error",
				text: "Failed to create stream"
			});
		}
	};

	if (isEdit && auditLogStream.isLoading) {
		return (
			<div className="flex items-center justify-center p-8">
				<Spinner size="lg" />
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit(handleFormSubmit)}>
			<div>
				<Controller
					control={control}
					name="url"
					render={({ field, fieldState: { error } }) => (
						<FormControl label="URL" isError={Boolean(error?.message)} errorText={error?.message}>
							<Input {...field} />
						</FormControl>
					)}
				/>
				<Controller
					control={control}
					name="token"
					render={({ field, fieldState: { error } }) => (
						<FormControl
							label="Token"
							isOptional
							isError={Boolean(error?.message)}
							errorText={error?.message}
							helperText="A token serves for identification and is sent in Authorization Bearer format."
						>
							<Input {...field} />
						</FormControl>
					)}
				/>
			</div>
			<div className="mt-8 flex items-center">
				<Button className="mr-4" type="submit" isLoading={isSubmitting}>
					{isEdit ? "Save" : "Create"}
				</Button>
				<Button variant="plain" colorSchema="secondary" onClick={onClose}>
					Cancel
				</Button>
			</div>
		</form>
	);
};
