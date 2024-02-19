import {
  Link,
  redirect,
  useNavigate,
  useNavigation,
  useParams,
  useSubmit,
} from "react-router-dom";

import Modal from "../UI/Modal.jsx";
import EventForm from "./EventForm.jsx";
import { useQuery } from "@tanstack/react-query";
import { fetchEvent, queryClient, updateEvent } from "../../util/http.js";
import ErrorBlock from "../UI/ErrorBlock.jsx";

export default function EditEvent() {
  const navigate = useNavigate();
  const { state } = useNavigation();
  const submit = useSubmit();
  const params = useParams();

  const { data, isError, error } = useQuery({
    queryKey: ["events", params.id],
    queryFn: ({ signal }) => fetchEvent({ signal, id: params.id }),
    staleTime: 10000, // used to make sure react-query doesn't refetch the content if the cashed content is less than 10s old
  });

  //* this code to handle update event logic in case using useMutate() hook from @tanstack/react-query library
  // const { mutate } = useMutation({
  //   mutationFn: updateEvent,
  //   //* Optimistic Updating
  //   onMutate: async (data) => {
  //     const newEve nt = data.event;

  //     await queryClient.cancelQueries({ queryKey: ["events", params.id] }); //* to cancel any outgoing requests until the changes updated on front first and then sends the request to the backend (it will just cancel queries send by useQuery)
  //     const previousEvent = queryClient.getQueryData(["events", params.id]); //* get the old cached data

  //     queryClient.setQueryData(["events", params.id], newEvent); //* this will update the existing cached data in the front before sending the updates request to the backend

  //     return { previousEvent };
  //   },
  //   //* rooled back if an error occured
  //   onError: (error, data, context) => {
  //     //* error: is the error which happend, data: is the data submitted, context: is what retruned from onMutate function
  //     queryClient.setQueryData(["events", params.id], context.previousEvent);
  //   },
  //   //* this excuted after useMutation is done
  //   onSettled: () => {
  //     queryClient.invalidateQueries(["events", params.id]);
  //   },
  // });

  function handleSubmit(formData) {
    //* this code to handle form submittion in case using useMutate() hook from @tanstack/react-query library
    // mutate({ id: params.id, event: formData });
    // navigate("../");

    //* this code to handle form submittion in case using action() function used by react-router-dom library
    submit(formData, { method: "PUT" }); //* this code will treger action() function
  }

  function handleClose() {
    navigate("../");
  }

  let content;

  if (isError)
    content = (
      <>
        <ErrorBlock
          title="Failed to load event"
          message={
            error.info?.message ||
            "Failed to load event. Please check your inputs and try again later."
          }
        />
        <div className="form-actions">
          <Link to="../" className="button">
            Okay
          </Link>
        </div>
      </>
    );

  if (data)
    content = (
      <EventForm inputData={data} onSubmit={handleSubmit}>
        {state === "submitting" ? (
          <p>Sending data...</p>
        ) : (
          <>
            <Link to="../" className="button-text">
              Cancel
            </Link>
            <button type="submit" className="button">
              Update
            </button>
          </>
        )}
      </EventForm>
    );

  return <Modal onClose={handleClose}>{content}</Modal>;
}

export function loader({ params }) {
  return queryClient.fetchQuery({
    queryKey: ["events", params.id],
    queryFn: ({ signal }) => fetchEvent({ signal, id: params.id }),
  });
}

export async function action({ request, params }) {
  const formData = await request.formData();
  const updatedEventData = Object.fromEntries(formData);
  await updateEvent({ id: params.id, event: updatedEventData });
  await queryClient.invalidateQueries(["events"]);
  return redirect("../");
}
