package main

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path"
	"strings"
	"syscall"
	"time"

	"github.com/valyala/fasthttp"
	"github.com/valyala/fasttemplate"
)

const MetaTags = `
		<meta name="og:description" content="%s">
		<meta name="og:image" content="%s">
		<meta name="og:image:type" content="%s">
		<meta name="theme-color" content="#0288D1">
		<link type="application/json+oembed" href="%s">
`

const GQLQuery = `
query GetEmote($id: ObjectID!) {
    emote(id: $id) {
		id
        name
		animated
		created_at
		host {
			url
			files {
				frame_count
				width
				height
				format
			}
		}
        owner {
			id
            display_name
        }
        channels {
            total
        }
    }
}`

type EmoteFile struct {
	FrameCount int    `json:"frame_count"`
	Format     string `json:"format"`
	Width      int    `json:"width"`
	Height     int    `json:"height"`
}

type GQLEmoteResponse struct {
	Data struct {
		Emote *struct {
			ID        string    `json:"id"`
			Name      string    `json:"name"`
			Animated  bool      `json:"animated"`
			CreatedAt time.Time `json:"created_at"`
			Host       struct {
				URL   string      `json:"url"`
				Files []EmoteFile `json:"files"`
			} `json:"host"`
			Owner     struct {
				ID          string `json:"id"`
				DisplayName string `json:"display_name"`
			} `json:"owner"`
			Channels struct {
				Total int `json:"total"`
			} `json:"channels"`
		} `json:"emote"`
	} `json:"data"`
}

type OEmbedData struct {
	AuthorName   string `json:"author_name"`
	AuthorURL    string `json:"author_url"`
	ProviderName string `json:"provider_name"`
	ProviderURL  string `json:"provider_url"`
	Type         string `json:"type"`
	URL          string `json:"url"`
}

func main() {
	root := os.Getenv("FS_ROOT")
	if root == "" {
		root = "./public"
	}

	gqlApiURL := os.Getenv("GQL_API_URL")
	websiteURL := os.Getenv("WEBSITE_URL")

	// Setup FS handler
	fs := &fasthttp.FS{
		Root: root,
	}

	index, err := os.ReadFile(path.Join(root, "index.html"))
	if err != nil {
		panic(err)
	}

	favicon, err := os.ReadFile(path.Join(root, "favicon.ico"))
	if err != nil {
		panic(err)
	}

	//replace-me
	template := fasttemplate.New(string(index), "<!-- {{", "}} -->")

	addr := os.Getenv("WEBSITE_BIND")
	if addr == "" {
		addr = "0.0.0.0:3000"
	}

	// Start HTTP server.
	log.Printf("Starting HTTP server on %q\n", addr)
	go func() {
		handler := fs.NewRequestHandler()
		if err := fasthttp.ListenAndServe(addr, func(ctx *fasthttp.RequestCtx) {
			pth := string(ctx.Path())
			if strings.HasPrefix(pth, "/assets/") {
				handler(ctx)
			} else {
				if strings.HasPrefix(pth, "/emotes/") {
					id := strings.TrimSpace(strings.Split(strings.TrimPrefix(pth, "/emotes/"), "?")[0])

					// handle emote route
					body, err := json.Marshal(map[string]any{
						"query": GQLQuery,
						"variables": map[string]string{
							"id": id,
						},
					})

					if err != nil {
						log.Println("Failed to marshal request: ", err)
						goto end
					}

					req, err := http.NewRequestWithContext(ctx, "POST", fmt.Sprintf("%s", gqlApiURL), bytes.NewReader(body))
					if err != nil {
						log.Println("Failed to make request: ", err)
						goto end
					}

					req.Header.Set("Cf-Connecting-Ip", string(ctx.Request.Header.Peek("Cf-Connecting-Ip")))

					resp, err := http.DefaultClient.Do(req)
					if err != nil {
						log.Println("Failed to do request: ", err)
						goto end
					}

					defer resp.Body.Close()
					data, err := io.ReadAll(resp.Body)
					if err != nil {
						log.Println("Failed to read response: ", err)
						goto end
					}

					if resp.StatusCode != 200 {
						log.Println("Failed to get emote: ", string(data))
						goto end
					}

					gqlResp := GQLEmoteResponse{}
					if err := json.Unmarshal(data, &gqlResp); err != nil {
						log.Println("Failed to parse response: ", err)
						goto end
					}

					emote := gqlResp.Data.Emote
					if emote == nil || len(emote.Host.Files) == 0 {
						goto end
					}

					imageType := ""

					if emote.Animated {
						imageType = "gif"
					} else {
						imageType = "png"
					}

					url := fmt.Sprintf("%s/4x.%s", emote.Host.URL, imageType)

					oembed, _ := json.Marshal(OEmbedData{
						AuthorName:   fmt.Sprintf("%s by %s (%d Channels)", emote.Name, emote.Owner.DisplayName, emote.Channels.Total),
						AuthorURL:    fmt.Sprintf("%s/emotes/%s", websiteURL, emote.ID),
						ProviderName: "7TV.APP - It's like a third party thing",
						ProviderURL:  websiteURL,
						Type:         "image",
						URL:          url,
					})

					obj := base64.StdEncoding.EncodeToString(oembed)

					ctx.Response.Header.Set("Content-Type", "text/html; charset=utf-8")
					ctx.Response.Header.Set("Cache-Control", "no-cache")

					ctx.SetBodyString(template.ExecuteString(map[string]interface{}{
						"META": fmt.Sprintf(MetaTags,
							fmt.Sprintf("uploaded by %s", emote.Owner.DisplayName), // og:description
							url,                // og:image
							"image/"+imageType, // og:image:type
							fmt.Sprintf("%s/services/oembed/%s.json", websiteURL, obj), // oembed url
						),
					}))
					return
				} else if strings.HasPrefix(pth, "/services/oembed/") && strings.HasSuffix(pth, ".json") {
					out, err := base64.StdEncoding.DecodeString(strings.TrimSuffix(strings.TrimPrefix(pth, "/services/oembed/"), ".json"))
					if err != nil {
						ctx.SetStatusCode(404)
						return
					}

					data := OEmbedData{}
					if err = json.Unmarshal(out, &data); err == nil {
						out, _ = json.Marshal(data)
						ctx.Response.Header.Set("Content-Type", "application/json; charset=utf-8")
						ctx.Response.Header.Set("Cache-Control", "max-age=3600")
						ctx.SetBody(out)
						return
					}

					ctx.SetStatusCode(404)
					return
				} else if pth == "/favicon.ico" {
					ctx.Response.Header.Set("Content-Type", "image/ico")
					ctx.Response.Header.Set("Cache-Control", "max-age=3600")
					ctx.SetBody(favicon)
					return
				}

			end:
				ctx.Response.Header.Set("Content-Type", "text/html; charset=utf-8")
				ctx.Response.Header.Set("Cache-Control", "no-cache")
				ctx.SetBodyString(template.ExecuteString(map[string]interface{}{
					"META": "",
				}))
			}
		}); err != nil {
			log.Fatalf("error in ListenAndServe: %s", err)
		}
	}()

	log.Printf("Serving files from directory %s\n", root)

	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)

	// Wait forever.
	<-sig
}
